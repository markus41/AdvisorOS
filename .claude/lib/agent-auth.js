#!/usr/bin/env node

/**
 * Agent Authentication System for AdvisorOS
 * Implements mutual TLS authentication for agent-to-agent communication
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class AgentAuthenticationSystem {
  constructor() {
    this.authDir = path.join(__dirname, '..', 'auth');
    this.certsDir = path.join(this.authDir, 'certs');
    this.keysDir = path.join(this.authDir, 'keys');
    this.agentRegistry = path.join(this.authDir, 'agent-registry.json');

    this.ensureDirectories();
    this.initializeCA();
  }

  ensureDirectories() {
    [this.authDir, this.certsDir, this.keysDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
      }
    });
  }

  initializeCA() {
    const caKeyPath = path.join(this.keysDir, 'ca-key.pem');
    const caCertPath = path.join(this.certsDir, 'ca-cert.pem');

    if (!fs.existsSync(caKeyPath) || !fs.existsSync(caCertPath)) {
      console.log('🔐 Initializing Certificate Authority for Agent Authentication...');
      this.generateCA();
    }
  }

  generateCA() {
    const caKeyPath = path.join(this.keysDir, 'ca-key.pem');
    const caCertPath = path.join(this.certsDir, 'ca-cert.pem');

    // Generate CA private key
    execSync(`openssl genrsa -out "${caKeyPath}" 4096`, { stdio: 'pipe' });
    fs.chmodSync(caKeyPath, 0o600);

    // Generate CA certificate
    const caConfig = `
[req]
distinguished_name = req_distinguished_name
x509_extensions = v3_ca
prompt = no

[req_distinguished_name]
C = US
ST = CA
L = San Francisco
O = AdvisorOS
OU = Agent Authentication CA
CN = AdvisorOS Agent CA

[v3_ca]
basicConstraints = critical,CA:TRUE
keyUsage = critical,keyCertSign,cRLSign
subjectKeyIdentifier = hash
authorityKeyIdentifier = keyid:always,issuer:always
`;

    const caConfigPath = path.join(this.authDir, 'ca.conf');
    fs.writeFileSync(caConfigPath, caConfig);

    execSync(`openssl req -new -x509 -key "${caKeyPath}" -out "${caCertPath}" -days 3650 -config "${caConfigPath}"`, { stdio: 'pipe' });

    console.log('✅ Certificate Authority initialized successfully');
  }

  generateAgentCertificate(agentName, agentType) {
    const agentKeyPath = path.join(this.keysDir, `${agentName}-key.pem`);
    const agentCertPath = path.join(this.certsDir, `${agentName}-cert.pem`);
    const agentCsrPath = path.join(this.authDir, `${agentName}-csr.pem`);

    // Generate agent private key
    execSync(`openssl genrsa -out "${agentKeyPath}" 2048`, { stdio: 'pipe' });
    fs.chmodSync(agentKeyPath, 0o600);

    // Create agent certificate configuration
    const agentConfig = `
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[req_distinguished_name]
C = US
ST = CA
L = San Francisco
O = AdvisorOS
OU = Agent
CN = ${agentName}

[v3_req]
basicConstraints = CA:FALSE
keyUsage = nonRepudiation,digitalSignature,keyEncipherment
subjectAltName = @alt_names
extendedKeyUsage = clientAuth,serverAuth

[alt_names]
DNS.1 = ${agentName}
DNS.2 = ${agentName}.advisoros.local
DNS.3 = agent-${agentType}.advisoros.local
`;

    const agentConfigPath = path.join(this.authDir, `${agentName}.conf`);
    fs.writeFileSync(agentConfigPath, agentConfig);

    // Generate certificate signing request
    execSync(`openssl req -new -key "${agentKeyPath}" -out "${agentCsrPath}" -config "${agentConfigPath}"`, { stdio: 'pipe' });

    // Sign certificate with CA
    const caKeyPath = path.join(this.keysDir, 'ca-key.pem');
    const caCertPath = path.join(this.certsDir, 'ca-cert.pem');

    execSync(`openssl x509 -req -in "${agentCsrPath}" -CA "${caCertPath}" -CAkey "${caKeyPath}" -CAcreateserial -out "${agentCertPath}" -days 365 -extensions v3_req -extfile "${agentConfigPath}"`, { stdio: 'pipe' });

    // Clean up CSR and config files
    fs.unlinkSync(agentCsrPath);
    fs.unlinkSync(agentConfigPath);

    // Register agent
    this.registerAgent(agentName, agentType, agentCertPath, agentKeyPath);

    console.log(`✅ Certificate generated for agent: ${agentName}`);
    return {
      certPath: agentCertPath,
      keyPath: agentKeyPath,
      caPath: caCertPath
    };
  }

  registerAgent(agentName, agentType, certPath, keyPath) {
    let registry = {};

    if (fs.existsSync(this.agentRegistry)) {
      registry = JSON.parse(fs.readFileSync(this.agentRegistry, 'utf8'));
    }

    // Generate agent ID
    const agentId = crypto.randomUUID();

    // Extract certificate fingerprint for verification
    const certContent = fs.readFileSync(certPath, 'utf8');
    const fingerprint = crypto
      .createHash('sha256')
      .update(certContent)
      .digest('hex');

    registry[agentName] = {
      id: agentId,
      type: agentType,
      certPath: certPath,
      keyPath: keyPath,
      fingerprint: fingerprint,
      createdAt: new Date().toISOString(),
      status: 'active',
      permissions: this.getDefaultPermissions(agentType)
    };

    fs.writeFileSync(this.agentRegistry, JSON.stringify(registry, null, 2));
    fs.chmodSync(this.agentRegistry, 0o600);

    return agentId;
  }

  getDefaultPermissions(agentType) {
    const permissionMatrix = {
      'cpa-tax-compliance': [
        'Read', 'database:read:tax_data', 'api:call:tax_calculation'
      ],
      'document-intelligence-optimizer': [
        'Read', 'Write', 'azure:cognitive:form_recognizer', 'storage:write:documents'
      ],
      'financial-prediction-modeler': [
        'Read', 'database:read:financial_data', 'azure:cognitive:analytics'
      ],
      'security-auditor': [
        'Read', 'Grep', 'database:read:audit_logs', 'system:scan:vulnerabilities'
      ],
      'backend-api-developer': [
        'Read', 'Write', 'Edit', 'database:write:all', 'api:create:endpoints'
      ],
      'frontend-builder': [
        'Read', 'Write', 'Edit', 'npm:*', 'build:frontend'
      ],
      'integration-specialist': [
        'Read', 'Write', 'api:external:quickbooks', 'api:external:stripe'
      ],
      'default': [
        'Read', 'Grep'
      ]
    };

    return permissionMatrix[agentType] || permissionMatrix['default'];
  }

  verifyAgent(agentName, providedFingerprint) {
    if (!fs.existsSync(this.agentRegistry)) {
      return { valid: false, reason: 'Agent registry not found' };
    }

    const registry = JSON.parse(fs.readFileSync(this.agentRegistry, 'utf8'));
    const agent = registry[agentName];

    if (!agent) {
      return { valid: false, reason: 'Agent not registered' };
    }

    if (agent.status !== 'active') {
      return { valid: false, reason: 'Agent not active' };
    }

    if (agent.fingerprint !== providedFingerprint) {
      return { valid: false, reason: 'Certificate fingerprint mismatch' };
    }

    return {
      valid: true,
      agent: {
        id: agent.id,
        type: agent.type,
        permissions: agent.permissions
      }
    };
  }

  getAgentCertificates(agentName) {
    if (!fs.existsSync(this.agentRegistry)) {
      throw new Error('Agent registry not found');
    }

    const registry = JSON.parse(fs.readFileSync(this.agentRegistry, 'utf8'));
    const agent = registry[agentName];

    if (!agent) {
      throw new Error(`Agent ${agentName} not registered`);
    }

    const caCertPath = path.join(this.certsDir, 'ca-cert.pem');

    return {
      cert: fs.readFileSync(agent.certPath, 'utf8'),
      key: fs.readFileSync(agent.keyPath, 'utf8'),
      ca: fs.readFileSync(caCertPath, 'utf8'),
      fingerprint: agent.fingerprint
    };
  }

  revokeAgent(agentName) {
    if (!fs.existsSync(this.agentRegistry)) {
      throw new Error('Agent registry not found');
    }

    const registry = JSON.parse(fs.readFileSync(this.agentRegistry, 'utf8'));

    if (registry[agentName]) {
      registry[agentName].status = 'revoked';
      registry[agentName].revokedAt = new Date().toISOString();

      fs.writeFileSync(this.agentRegistry, JSON.stringify(registry, null, 2));
      console.log(`✅ Agent ${agentName} revoked successfully`);
    }
  }

  listAgents() {
    if (!fs.existsSync(this.agentRegistry)) {
      return {};
    }

    const registry = JSON.parse(fs.readFileSync(this.agentRegistry, 'utf8'));

    // Return only non-sensitive information
    const safeRegistry = {};
    Object.keys(registry).forEach(agentName => {
      const agent = registry[agentName];
      safeRegistry[agentName] = {
        id: agent.id,
        type: agent.type,
        status: agent.status,
        createdAt: agent.createdAt,
        permissions: agent.permissions
      };
    });

    return safeRegistry;
  }

  generateAgentForAllExisting() {
    const agentDir = path.join(__dirname, '..', 'agents');

    if (!fs.existsSync(agentDir)) {
      console.log('⚠️  Agents directory not found');
      return;
    }

    const agentFiles = fs.readdirSync(agentDir).filter(file => file.endsWith('.md'));

    console.log(`🔐 Generating certificates for ${agentFiles.length} agents...`);

    agentFiles.forEach(file => {
      const agentName = path.basename(file, '.md');
      const agentContent = fs.readFileSync(path.join(agentDir, file), 'utf8');

      // Extract agent type from frontmatter
      const frontmatterMatch = agentContent.match(/^---\n(.*?)\n---/s);
      let agentType = 'default';

      if (frontmatterMatch) {
        const frontmatter = frontmatterMatch[1];
        const nameMatch = frontmatter.match(/name:\s*(.+)/);
        if (nameMatch) {
          agentType = nameMatch[1].trim();
        }
      }

      this.generateAgentCertificate(agentName, agentType);
    });

    console.log('✅ All agent certificates generated successfully');
  }
}

// CLI interface
if (require.main === module) {
  const auth = new AgentAuthenticationSystem();

  const command = process.argv[2];
  const agentName = process.argv[3];
  const agentType = process.argv[4];

  switch (command) {
    case 'init':
      console.log('🔐 Agent Authentication System initialized');
      break;

    case 'generate':
      if (!agentName || !agentType) {
        console.error('Usage: node agent-auth.js generate <agent-name> <agent-type>');
        process.exit(1);
      }
      auth.generateAgentCertificate(agentName, agentType);
      break;

    case 'generate-all':
      auth.generateAgentForAllExisting();
      break;

    case 'verify':
      if (!agentName) {
        console.error('Usage: node agent-auth.js verify <agent-name> <fingerprint>');
        process.exit(1);
      }
      const fingerprint = process.argv[4];
      const result = auth.verifyAgent(agentName, fingerprint);
      console.log(JSON.stringify(result, null, 2));
      break;

    case 'list':
      console.log(JSON.stringify(auth.listAgents(), null, 2));
      break;

    case 'revoke':
      if (!agentName) {
        console.error('Usage: node agent-auth.js revoke <agent-name>');
        process.exit(1);
      }
      auth.revokeAgent(agentName);
      break;

    default:
      console.log(`
AdvisorOS Agent Authentication System

Usage:
  node agent-auth.js init                           Initialize authentication system
  node agent-auth.js generate <name> <type>         Generate certificate for agent
  node agent-auth.js generate-all                   Generate certificates for all existing agents
  node agent-auth.js verify <name> <fingerprint>    Verify agent certificate
  node agent-auth.js list                           List all registered agents
  node agent-auth.js revoke <name>                  Revoke agent certificate
`);
      break;
  }
}

module.exports = AgentAuthenticationSystem;