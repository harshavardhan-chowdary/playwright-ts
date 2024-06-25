const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const minimist = require('minimist');

const readFile = promisify(fs.readFile);
const readdir = promisify(fs.readdir);

const REQUIREMENT_TAG = '@requirement';

async function getRequirements(reqFilePath) {
  const data = await readFile(reqFilePath, 'utf-8');
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

async function extractRequirementsAndTags(filePath, keyPrefix) {
  const code = await readFile(filePath, 'utf-8');
  const ast = parse(code, { sourceType: 'module', plugins: ['typescript'] });
  const requirementsAndDescriptions = [];

  traverse(ast, {
    enter(path) {
      if (path.isCallExpression() && path.node.callee.name === 'test') {
        const leadingComments = path.parent.leadingComments;
        let requirement = null;
        let tags = [];

        if (leadingComments) {
          leadingComments.forEach((comment) => {
            const requirementMatch = new RegExp(`${REQUIREMENT_TAG}\\s+(${keyPrefix}\\d+)`).exec(comment.value);
            if (requirementMatch) {
              requirement = requirementMatch[1];
            }
          });
        }

        if (path.node.arguments.length > 1 && path.node.arguments[1].type === 'ObjectExpression') {
          const tagProperty = path.node.arguments[1].properties.find(prop => prop.key.name === 'tag');
          if (tagProperty && tagProperty.value.type === 'ArrayExpression') {
            tags = tagProperty.value.elements.map(el => el.value);
          }
        }

        const description = path.node.arguments[0].value;

        if (requirement) {
          requirementsAndDescriptions.push({ requirement, description, tags });
        }
      }
    },
  });

  return requirementsAndDescriptions;
}

(async function generateRTM() {
  const args = minimist(process.argv.slice(2));
  const testRoot = args.root;
  const reqFilePath = args.reqfile;
  const keyPrefix = args.key;

  if (!testRoot) {
    console.error('Error: --root argument is required');
    process.exit(1);
  }

  if (!reqFilePath) {
    console.error('Error: --reqfile argument is required');
    process.exit(1);
  }

  if (!keyPrefix) {
    console.error('Error: --key argument is required');
    process.exit(1);
  }

  const requirements = await getRequirements(reqFilePath);
  const testFiles = await getTestFiles(path.resolve(testRoot));

  console.log(`Found ${testFiles.length} test files`);

  const rtm = requirements.map((req) => ({
    requirement: req,
    testCases: [],
  }));

  const specList = [];

  for (const file of testFiles) {
    const reqsAndTags = await extractRequirementsAndTags(file, keyPrefix);
    console.log(`File: ${file}, Requirements and Tags:`, reqsAndTags);
    const uniqueRequirements = new Set();
    reqsAndTags.forEach(({ requirement, description, tags }) => {
      const rtmEntry = rtm.find((entry) => entry.requirement.id === requirement);
      if (rtmEntry) {
        rtmEntry.testCases.push({ description, tags });
      }
      uniqueRequirements.add(requirement);
    });
    specList.push({
      file: path.basename(file),
      requirements: Array.from(uniqueRequirements),
    });
  }

  // Remove duplicate test cases from RTM
  rtm.forEach((entry) => {
    entry.testCases = entry.testCases.reduce((unique, o) => {
      if (!unique.some(obj => obj.description === o.description)) {
        unique.push(o);
      }
      return unique;
    }, []);
  });

  const outputPath = path.join(__dirname, 'rtm.json');
  const rtmData = { rtm, specList };
  await fs.promises.writeFile(outputPath, JSON.stringify(rtmData, null, 2), 'utf-8');
  console.log(`Requirement Traceability Matrix saved to ${outputPath}`);
})();
