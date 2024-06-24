const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const minimist = require('minimist');

const readFile = promisify(fs.readFile);
const readdir = promisify(fs.readdir);

const REQUIREMENT_TAG = '@requirement';

async function getRequirements() {
  const data = await readFile(path.join(__dirname, 'requirements.json'), 'utf-8');
  return JSON.parse(data);
}

async function getTestFiles(dir) {
  const files = await readdir(dir, { withFileTypes: true });
  const testFiles = await Promise.all(
    files.map(async (file) => {
      const res = path.resolve(dir, file.name);
      return file.isDirectory() ? getTestFiles(res) : res;
    })
  );
  return Array.prototype.concat(...testFiles).filter((file) => file.endsWith('.spec.ts'));
}

async function extractRequirementsAndDescriptions(filePath) {
  const code = await readFile(filePath, 'utf-8');
  const ast = parse(code, { sourceType: 'module', plugins: ['typescript'] });
  const requirementsAndDescriptions = [];

  traverse(ast, {
    enter(path) {
      if (path.isCallExpression() && path.node.callee.name === 'test') {
        const leadingComments = path.parent.leadingComments;
        if (leadingComments) {
          leadingComments.forEach((comment) => {
            const requirementMatch = new RegExp(`${REQUIREMENT_TAG}\\s+(REQ-\\d+)`).exec(comment.value);
            if (requirementMatch) {
              const description = path.node.arguments[0].value;
              requirementsAndDescriptions.push({ requirement: requirementMatch[1], description });
            }
          });
        }
      }
    },
  });

  return requirementsAndDescriptions;
}

(async function generateRTM() {
  const args = minimist(process.argv.slice(2));
  const testRoot = args.root;

  if (!testRoot) {
    console.error('Error: --root argument is required');
    process.exit(1);
  }

  const requirements = await getRequirements();
  const testFiles = await getTestFiles(path.resolve(testRoot));

  console.log(`Found ${testFiles.length} test files`);

  const rtm = requirements.map((req) => {
    return {
      requirement: req,
      testCases: [],
    };s
  });

  const specList = [];

  for (const file of testFiles) {
    const reqsAndDescs = await extractRequirementsAndDescriptions(file);
    console.log(`File: ${file}, Requirements and Descriptions:`, reqsAndDescs);
    const uniqueRequirements = new Set();
    reqsAndDescs.forEach(({ requirement, description }) => {
      const rtmEntry = rtm.find((entry) => entry.requirement.id === requirement);
      if (rtmEntry) {
        rtmEntry.testCases.push(description);
      }
      uniqueRequirements.add(requirement);
    });
    specList.push({
      file: path.basename(file),
      requirements: Array.from(uniqueRequirements),
    });
  }

  const outputPath = path.join(__dirname, 'rtm.json');
  const rtmData = { rtm, specList };
  await fs.promises.writeFile(outputPath, JSON.stringify(rtmData, null, 2), 'utf-8');
  console.log(`Requirement Traceability Matrix saved to ${outputPath}`);
})();
