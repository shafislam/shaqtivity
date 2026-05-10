import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

let prisma;
function getPrisma() {
  if (!prisma) {
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    prisma = new PrismaClient({ adapter });
  }
  return prisma;
}
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

console.log("Server starting...");
console.log("DATABASE_URL defined:", !!process.env.DATABASE_URL);
console.log("Environment:", process.env.NODE_ENV);

// Check health
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Create User (Onboarding)
app.post('/api/user', async (req, res) => {
  try {
    const { playerName, startingClass, powerLevel, environment, avatarUrl } = req.body;
    
    // Generate a 6 character alphanumeric retro save code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let saveCode = '';
    for(let i=0; i<6; i++) {
        saveCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    const baseVal = powerLevel === 'advanced' ? 150 : powerLevel === 'intermediate' ? 100 : 50;

    const user = await getPrisma().user.create({
      data: {
        saveCode,
        playerName,
        avatarUrl: avatarUrl || '/avatar_front.png',
        startingClass: startingClass || 'unknown',
        environment: environment || 'unknown',
        stats: {
          create: [
            { muscleGroup: 'chest', powerLevel: baseVal },
            { muscleGroup: 'back', powerLevel: baseVal },
            { muscleGroup: 'legs', powerLevel: baseVal },
            { muscleGroup: 'cardio', powerLevel: baseVal },
            { muscleGroup: 'shoulders', powerLevel: baseVal },
            { muscleGroup: 'biceps', powerLevel: baseVal },
            { muscleGroup: 'triceps', powerLevel: baseVal },
            { muscleGroup: 'core', powerLevel: baseVal }
          ]
        }
      },
      include: {
        stats: true
      }
    });

    res.json(user);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Login with Save Code
app.post('/api/login', async (req, res) => {
  try {
    const { saveCode } = req.body;
    if (!saveCode) return res.status(400).json({ error: 'Save code required' });

    const user = await getPrisma().user.findUnique({
      where: { saveCode: saveCode.toUpperCase() }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid Save Code' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Fetch specific user data
app.get('/api/user/:saveCode', async (req, res) => {
  try {
    const { saveCode } = req.params;
    const user = await getPrisma().user.findUnique({
      where: { saveCode: saveCode.toUpperCase() },
      include: {
        stats: true,
        preferences: true,
        sessions: {
          include: {
            exercises: {
              include: {
                sets: true
              }
            }
          }
        }
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'No user found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Create Session (Log Workout)
app.post('/api/sessions', async (req, res) => {
  try {
    const { userId, sessionDate, status, excuseReason, exercises, effortXp, level, stats } = req.body;
    
    // Create the session and nested exercises/sets
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

    if (effortXp !== undefined && level !== undefined) {
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
    console.error("Error creating session:", error);
    res.status(500).json({ error: 'Failed to save session' });
  }
});

// Update User Preference (Settings)
app.post('/api/preferences', async (req, res) => {
  try {
    const { userId, type, name, isEnabled } = req.body;
    
    const pref = await getPrisma().userPreference.upsert({
      where: {
        userId_type_name: {
          userId,
          type,
          name
        }
      },
      update: { isEnabled },
      create: { userId, type, name, isEnabled }
    });
    
    res.json(pref);
  } catch (error) {
    console.error("Error saving preference:", error);
    res.status(500).json({ error: 'Failed to save preference' });
  }
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Backend API listening on port ${PORT}`);
  });
}

export default app;
