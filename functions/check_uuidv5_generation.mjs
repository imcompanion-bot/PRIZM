import { v5 as uuidv5 } from 'uuid';

const NAMESPACE = "1b671a64-40d5-491e-99b0-da01ff1f3341";

const title1 = "adi EU Collective: Seeding Brief 1";
const id1 = uuidv5(`project_${title1}`, NAMESPACE);
console.log(`Title: "${title1}" -> uuidv5: ${id1}`);

const title2 = "Dove Men FIFA 2026 Program";
const id2 = uuidv5(`project_${title2}`, NAMESPACE);
console.log(`Title: "${title2}" -> uuidv5: ${id2}`);
