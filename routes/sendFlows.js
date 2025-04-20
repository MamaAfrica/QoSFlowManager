// sendFlows.js
const fs = require('fs');
const axios = require('axios');
const path = require('path');
const { console } = require('inspector');

const flowsPath = path.join(__dirname, '../flows.json');
const flowData = JSON.parse(fs.readFileSync(flowsPath, 'utf8'));

console.log("flowData", flowData)

const ONOS_API = 'http://141.147.15.98:8181/onos/v1/flows';

async function sendFlows() {
  const results = [];

  for (const flow of flowData.flows) {
    try {
      const response = await axios.post(
        ONOS_API,
        flow,
        {
          auth: { username: 'onos', password: 'rocks' },
          headers: { 'Content-Type': 'application/json' }
        }
      );
      results.push({ success: true, flow: flow.priority });
    } catch (error) {
      results.push({ success: false, flow: flow.priority, error: error.response?.data || error.message });
    }
  }

  return results;
}

module.exports = sendFlows;
