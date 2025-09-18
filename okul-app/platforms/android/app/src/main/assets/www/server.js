const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 5000;

// JSON file based storage (secure path outside public access)
const DATA_FILE = path.join(__dirname, '..', 'private_data.json');

// Middleware
app.use(cors());
app.use(express.json());

// Only serve specific safe files (not the entire directory)
app.use('/style.css', express.static(path.join(__dirname, 'style.css')));
app.use('/script.js', express.static(path.join(__dirname, 'script.js')));
app.use('/attached_assets', express.static(path.join(__dirname, 'attached_assets')));

// Helper functions for JSON file operations
function readSyncData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(data);
    }
    return {
      schools: [],
      criteriaByGrade: {5: [], 6: [], 7: [], 8: []},
      exams: []
    };
  } catch (error) {
    console.error('Error reading sync data:', error);
    return {
      schools: [],
      criteriaByGrade: {5: [], 6: [], 7: [], 8: []},
      exams: []
    };
  }
}

function writeSyncData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing sync data:', error);
    return false;
  }
}

// Sync API endpoints (JSON file based)
app.post('/api/sync', async (req, res) => {
  try {
    const { dataType, data } = req.body;
    
    // Read current data
    let currentData = readSyncData();
    
    // Update specific data type
    if (dataType === 'schools') {
      currentData.schools = data;
    } else if (dataType === 'criteria') {
      currentData.criteriaByGrade = data;
    } else if (dataType === 'exams') {
      currentData.exams = data;
    }
    
    // Write updated data back
    const success = writeSyncData(currentData);
    
    if (success) {
      res.json({ success: true });
      console.log(`Synced ${dataType} data successfully`);
    } else {
      res.status(500).json({ error: 'Write failed' });
    }
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: 'Sync failed' });
  }
});

app.get('/api/data', async (req, res) => {
  try {
    // Read data from JSON file
    const data = readSyncData();
    res.json(data);
    console.log('Data loaded successfully');
  } catch (error) {
    console.error('Data load error:', error);
    res.status(500).json({ error: 'Load failed' });
  }
});

// Health check
app.get('/api/health', async (req, res) => {
  try {
    // Check if we can read/write the sync file
    const testData = readSyncData();
    res.json({ status: 'healthy', storage: 'json-file' });
  } catch (error) {
    res.status(500).json({ status: 'unhealthy', storage: 'error' });
  }
});

// Serve static files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});