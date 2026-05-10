import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const app = express();
app.use(cors());
app.use(express.json());

let prisma;
function getPrisma() {
  if (!prisma) {
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    prisma = new PrismaClient({ adapter });
  }
  return prisma;
}

const apiRouter = express.Router();

// Health Check
apiRouter.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Create User
apiRouter.post('/user', async (req, res) => {
  try {
    const { playerName, startingClass, powerLevel, environment, avatarUrl } = req.body;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let saveCode = '';
    for(let i=0; i<6; i++) saveCode += chars.charAt(Math.floor(Math.random() * chars.length));
    
    const baseVal = powerLevel === 'advanced' ? 150 : powerLevel === 'intermediate' ? 100 : 50;

    const db = getPrisma();
    
    // 1. Create User
    const user = await db.user.create({
      data: {
        saveCode,
        playerName,
        avatarUrl: avatarUrl || '/avatar_front.png',
        startingClass: startingClass || 'unknown',
        environment: environment || 'unknown'
      }
    });

    // 2. Create Stats
    await db.userStat.createMany({
      data: [
        { userId: user.id, muscleGroup: 'chest', powerLevel: baseVal },
        { userId: user.id, muscleGroup: 'back', powerLevel: baseVal },
        { userId: user.id, muscleGroup: 'legs', powerLevel: baseVal },
        { userId: user.id, muscleGroup: 'cardio', powerLevel: baseVal },
        { userId: user.id, muscleGroup: 'shoulders', powerLevel: baseVal },
        { userId: user.id, muscleGroup: 'biceps', powerLevel: baseVal },
        { userId: user.id, muscleGroup: 'triceps', powerLevel: baseVal },
        { userId: user.id, muscleGroup: 'core', powerLevel: baseVal }
      ]
    });

    // 3. Return full user
    const finalUser = await db.user.findUnique({
      where: { id: user.id },
      include: { stats: true }
    });

    res.json(finalUser);
  } catch (error) {
    console.error("ONBOARDING ERROR:", error);
    res.status(500).json({ 
      error: error.message, 
      code: error.code,
      meta: error.meta,
      stack: error.stack?.split('\n').slice(0, 5).join('\n')
    });
  }
});

// Login
apiRouter.post('/login', async (req, res) => {
  try {
    const { saveCode } = req.body;
    const user = await getPrisma().user.findUnique({
      where: { saveCode: saveCode.toUpperCase() },
      include: { stats: true, preferences: true, sessions: { include: { exercises: { include: { sets: true } } } } }
    });
    if (!user) return res.status(404).json({ error: 'Not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get User
apiRouter.get('/user/:saveCode', async (req, res) => {
  try {
    const user = await getPrisma().user.findUnique({
      where: { saveCode: req.params.saveCode.toUpperCase() },
      include: { stats: true, preferences: true, sessions: { include: { exercises: { include: { sets: true } } } } }
    });
    if (!user) return res.status(404).json({ error: 'Not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save Session
apiRouter.post('/sessions', async (req, res) => {
  try {
    const { userId, sessionDate, status, excuseReason, exercises, effortXp, level, stats } = req.body;
    const session = await getPrisma().session.create({
      data: {
        userId,
        sessionDate: new Date(sessionDate),
        status,
        excuseReason,
        exercises: {
          create: exercises.map(ex => ({
            exerciseName: ex.name,
            targetMuscle: ex.muscle,
            sets: {
              create: ex.sets.map((set, idx) => ({
                setNumber: idx + 1,
                reps: set.reps,
                targetReps: set.targetReps,
                weight: set.weight,
                minutes: set.minutes,
                targetMinutes: set.targetMinutes,
                isCompleted: set.completed
              }))
            }
          }))
        }
      }
    });

    if (effortXp !== undefined) {
      await getPrisma().user.update({
        where: { id: userId },
        data: { effortXp, level }
      });
    }

    if (stats) {
      for (const [muscle, powerLevel] of Object.entries(stats)) {
        await getPrisma().userStat.updateMany({
          where: { userId, muscleGroup: muscle },
          data: { powerLevel }
        });
      }
    }
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Preferences
apiRouter.post('/preferences', async (req, res) => {
  try {
    const { userId, type, name, isEnabled } = req.body;
    const pref = await getPrisma().userPreference.upsert({
      where: { userId_type_name: { userId, type, name } },
      update: { isEnabled },
      create: { userId, type, name, isEnabled }
    });
    res.json(pref);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.use('/api', apiRouter);

export default app;
