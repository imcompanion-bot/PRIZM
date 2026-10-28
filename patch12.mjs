import fs from 'fs';
const file = 'src/pages/WipTracker/WipTrackerPage.tsx';
let code = fs.readFileSync(file, 'utf8');

// Need to pass isStagesInitialized to the dependency array of filteredProjects
code = code.replace(
  '  }, [flaggedProjects, selectedOffice, selectedClient, selectedStages]);',
  '  }, [flaggedProjects, selectedOffice, selectedClient, selectedStages, isStagesInitialized]);'
);

fs.writeFileSync(file, code);
