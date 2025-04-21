const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
 

const app = express();
const PORT = 3000;
const flowsPath = path.join(__dirname, 'Switchtwoflows.json');
const flowsPathOne = path.join(__dirname, 'Switchoneflows.json');
const flowsPathThree = path.join(__dirname, 'Switchthreeflows.json');

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));



app.post('/send-flows', async (req, res) => {
  try {
   
    const requestData = JSON.parse(fs.readFileSync(flowsPath, 'utf-8'));

    const response = await axios.post('http://141.147.15.98:8181/onos/v1/flows', requestData, {
      auth: {
        username: 'onos',
        password: 'rocks'
      }
    });
    
    const flows = response.data.flows
    
    res.render('results', { flows})

 
  } catch (err) {
    console.error('Error sending flows:', err.message);
    res.status(500).send('Failed to send flows');
  }
});




// Load all flows

app.get('/', (req, res) => {
 
 
  res.render('index');
});

app.get('/switchtwo', (req, res) => {
  const flows = JSON.parse(fs.readFileSync(flowsPath)).flows;
 
  res.render('switchtwo', { flows});
});

// Render edit form
app.get('/edit/:index', (req, res) => {
  const index = parseInt(req.params.index);
  const flows = JSON.parse(fs.readFileSync(flowsPath)).flows;
  res.render('edit', { flow: flows[index], index });
});

// Add a flow
app.post('/add', async (req, res) => {
  const flowsData = JSON.parse(fs.readFileSync(flowsPath));
  const flow = buildFlowFromForm(req.body);
  flowsData.flows.push(flow);
  fs.writeFileSync(flowsPath, JSON.stringify(flowsData, null, 2));

  // Send to ONOS API
  await axios.post('http://141.147.15.98:8181/onos/v1/flows', { flows: [flow] }, {
    auth: { username: 'onos', password: 'rocks' }
  });

  res.redirect('/');
});

// Update a flow
 

app.post('/update/:index', (req, res) => {
  const index = parseInt(req.params.index);
  const flowsData = JSON.parse(fs.readFileSync(flowsPath));

  // Get the original flow
  const originalFlow = flowsData.flows[index];

  // Create a new flow object by merging
  const updatedFlow = {};
  for (const key in originalFlow) {
    updatedFlow[key] = req.body[key] && req.body[key].trim() !== ''
      ? req.body[key]
      : originalFlow[key];
  }

  // Update the flows data
  flowsData.flows[index] = updatedFlow;

  fs.writeFileSync(flowsPath, JSON.stringify(flowsData, null, 2));
  res.redirect('/');
});


// Delete a flow
app.post('/delete/:index', (req, res) => {
  const index = parseInt(req.params.index);
  const flowsData = JSON.parse(fs.readFileSync(flowsPath));
  flowsData.flows.splice(index, 1);
  fs.writeFileSync(flowsPath, JSON.stringify(flowsData, null, 2));
  res.redirect('/');
});

// Helper to build flow JSON
function buildFlowFromForm(body) {
  const isTCP = parseInt(body.protocol) === 6;
  return {
    priority: parseInt(body.priority),
    timeout: 0,
    isPermanent: true,
    deviceId: body.deviceId,
    treatment: {
      instructions: [
        { type: "OUTPUT", port: body.port }
      ]
    },
    selector: {
      criteria: [
        { type: "ETH_TYPE", ethType: "0x0800" },
        { type: "IP_PROTO", protocol: parseInt(body.protocol) },
        { type: "IPV4_DST", ip: body.ipDst },
        isTCP ? { type: "TCP_DST", tcpPort: parseInt(body.dstPort) }
              : { type: "UDP_DST", udpPort: parseInt(body.dstPort) }
      ]
    }
  };
}

app.listen(PORT, () => console.log(`Server running on http://127.0.0.1:${PORT}`));
