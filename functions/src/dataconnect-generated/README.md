# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `example`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*ListProjects*](#listprojects)
  - [*GetProject*](#getproject)
  - [*ListPeople*](#listpeople)
  - [*ListRoles*](#listroles)
  - [*ListRateCards*](#listratecards)
  - [*ListTimeEntries*](#listtimeentries)
  - [*ListTimeEntriesByProject*](#listtimeentriesbyproject)
  - [*ListProjectPhases*](#listprojectphases)
  - [*ListAllocations*](#listallocations)
  - [*ListDataImports*](#listdataimports)
  - [*GetAppUserByEmail*](#getappuserbyemail)
  - [*ListAppUsers*](#listappusers)
  - [*GetOldestTimeEntry*](#getoldesttimeentry)
  - [*GetNewestTimeEntry*](#getnewesttimeentry)
  - [*GetTimeEntriesByDateRange*](#gettimeentriesbydaterange)
  - [*GetAllTimeEntries*](#getalltimeentries)
  - [*ListProjectScopes*](#listprojectscopes)
  - [*ListBillabilityRules*](#listbillabilityrules)
  - [*ListBillabilityRuleConditions*](#listbillabilityruleconditions)
- [**Mutations**](#mutations)
  - [*InsertAllocations*](#insertallocations)
  - [*UpsertAllocations*](#upsertallocations)
  - [*InsertBillabilityRuleConditions*](#insertbillabilityruleconditions)
  - [*UpsertBillabilityRuleConditions*](#upsertbillabilityruleconditions)
  - [*InsertBillabilityRules*](#insertbillabilityrules)
  - [*UpsertBillabilityRules*](#upsertbillabilityrules)
  - [*InsertClientTeamAllocations*](#insertclientteamallocations)
  - [*UpsertClientTeamAllocations*](#upsertclientteamallocations)
  - [*InsertDailyAllocations*](#insertdailyallocations)
  - [*UpsertDailyAllocations*](#upsertdailyallocations)
  - [*InsertDataImports*](#insertdataimports)
  - [*UpsertDataImports*](#upsertdataimports)
  - [*InsertPeople*](#insertpeople)
  - [*UpsertPeople*](#upsertpeople)
  - [*InsertPhaseAllocations*](#insertphaseallocations)
  - [*UpsertPhaseAllocations*](#upsertphaseallocations)
  - [*InsertProjectMonthlyRevenue*](#insertprojectmonthlyrevenue)
  - [*UpsertProjectMonthlyRevenue*](#upsertprojectmonthlyrevenue)
  - [*InsertProjectPhases*](#insertprojectphases)
  - [*UpsertProjectPhases*](#upsertprojectphases)
  - [*InsertProjectScopes*](#insertprojectscopes)
  - [*UpsertProjectScopes*](#upsertprojectscopes)
  - [*InsertProjects*](#insertprojects)
  - [*UpsertProjects*](#upsertprojects)
  - [*InsertRateCards*](#insertratecards)
  - [*UpsertRateCards*](#upsertratecards)
  - [*InsertRoles*](#insertroles)
  - [*UpsertRoles*](#upsertroles)
  - [*InsertTimeEntries*](#inserttimeentries)
  - [*UpsertTimeEntries*](#upserttimeentries)
  - [*CreateAppUser*](#createappuser)
  - [*UpdateAppUser*](#updateappuser)
  - [*DeleteAppUser*](#deleteappuser)
  - [*DeleteTimeEntriesByDate*](#deletetimeentriesbydate)
  - [*DeleteAllTimeEntries*](#deletealltimeentries)
  - [*DeleteBillabilityRules*](#deletebillabilityrules)
  - [*DeleteBillabilityRuleConditions*](#deletebillabilityruleconditions)
  - [*DeleteBillabilityRuleConditionsByRule*](#deletebillabilityruleconditionsbyrule)
  - [*DeletePeople*](#deletepeople)
  - [*UpdateTimeEntryPerson*](#updatetimeentryperson)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `example`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@dataconnect/generated-server` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated-server';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated-server';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## ListProjects
You can execute the `ListProjects` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listProjects(options?: ExecuteQueryOptions): QueryPromise<ListProjectsData, undefined>;

interface ListProjectsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListProjectsData, undefined>;
}
export const listProjectsRef: ListProjectsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listProjects(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListProjectsData, undefined>;

interface ListProjectsRef {
  ...
  (dc: DataConnect): QueryRef<ListProjectsData, undefined>;
}
export const listProjectsRef: ListProjectsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listProjectsRef:
```typescript
const name = listProjectsRef.operationName;
console.log(name);
```

### Variables
The `ListProjects` query has no variables.
### Return Type
Recall that executing the `ListProjects` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListProjectsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListProjectsData {
  projectss: ({
    id: UUIDString;
    title: string;
    opportunity_number?: string | null;
    sf_account?: string | null;
    parent_account?: string | null;
    ultimate_parent?: string | null;
    office?: string | null;
    start_date: DateString;
    end_date: DateString;
    rate_card_id?: UUIDString | null;
    rate_card_discount: number;
    fee_calc_currency?: string | null;
    fx_rate_gbp?: number | null;
    fx_rate_usd?: number | null;
    price?: number | null;
    media_cost?: number | null;
    gross_budget?: number | null;
    extra_data?: unknown | null;
    opportunity_record_type?: string | null;
    stage?: string | null;
    isActive?: boolean | null;
    revenue?: number | null;
  } & Projects_Key)[];
}
```
### Using `ListProjects`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listProjects } from '@dataconnect/generated-server';


// Call the `listProjects()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listProjects();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listProjects(dataConnect);

console.log(data.projectss);

// Or, you can use the `Promise` API.
listProjects().then((response) => {
  const data = response.data;
  console.log(data.projectss);
});
```

### Using `ListProjects`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listProjectsRef } from '@dataconnect/generated-server';


// Call the `listProjectsRef()` function to get a reference to the query.
const ref = listProjectsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listProjectsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.projectss);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.projectss);
});
```

## GetProject
You can execute the `GetProject` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getProject(vars: GetProjectVariables, options?: ExecuteQueryOptions): QueryPromise<GetProjectData, GetProjectVariables>;

interface GetProjectRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetProjectVariables): QueryRef<GetProjectData, GetProjectVariables>;
}
export const getProjectRef: GetProjectRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getProject(dc: DataConnect, vars: GetProjectVariables, options?: ExecuteQueryOptions): QueryPromise<GetProjectData, GetProjectVariables>;

interface GetProjectRef {
  ...
  (dc: DataConnect, vars: GetProjectVariables): QueryRef<GetProjectData, GetProjectVariables>;
}
export const getProjectRef: GetProjectRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getProjectRef:
```typescript
const name = getProjectRef.operationName;
console.log(name);
```

### Variables
The `GetProject` query requires an argument of type `GetProjectVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetProjectVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `GetProject` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetProjectData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetProjectData {
  projects?: {
    id: UUIDString;
    title: string;
  } & Projects_Key;
}
```
### Using `GetProject`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getProject, GetProjectVariables } from '@dataconnect/generated-server';

// The `GetProject` query requires an argument of type `GetProjectVariables`:
const getProjectVars: GetProjectVariables = {
  id: ..., 
};

// Call the `getProject()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getProject(getProjectVars);
// Variables can be defined inline as well.
const { data } = await getProject({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getProject(dataConnect, getProjectVars);

console.log(data.projects);

// Or, you can use the `Promise` API.
getProject(getProjectVars).then((response) => {
  const data = response.data;
  console.log(data.projects);
});
```

### Using `GetProject`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getProjectRef, GetProjectVariables } from '@dataconnect/generated-server';

// The `GetProject` query requires an argument of type `GetProjectVariables`:
const getProjectVars: GetProjectVariables = {
  id: ..., 
};

// Call the `getProjectRef()` function to get a reference to the query.
const ref = getProjectRef(getProjectVars);
// Variables can be defined inline as well.
const ref = getProjectRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getProjectRef(dataConnect, getProjectVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.projects);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.projects);
});
```

## ListPeople
You can execute the `ListPeople` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listPeople(options?: ExecuteQueryOptions): QueryPromise<ListPeopleData, undefined>;

interface ListPeopleRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListPeopleData, undefined>;
}
export const listPeopleRef: ListPeopleRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listPeople(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListPeopleData, undefined>;

interface ListPeopleRef {
  ...
  (dc: DataConnect): QueryRef<ListPeopleData, undefined>;
}
export const listPeopleRef: ListPeopleRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listPeopleRef:
```typescript
const name = listPeopleRef.operationName;
console.log(name);
```

### Variables
The `ListPeople` query has no variables.
### Return Type
Recall that executing the `ListPeople` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListPeopleData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListPeopleData {
  peoples: ({
    id: UUIDString;
    code?: string | null;
    name: string;
    team?: string | null;
    office: string;
    status?: string | null;
    type?: string | null;
    role_id?: UUIDString | null;
    overall_start_date?: DateString | null;
    overall_end_date?: DateString | null;
    employment_start_date?: DateString | null;
    employment_end_date?: DateString | null;
    annual_salary?: number | null;
    monthly_salary?: number | null;
    uk_percentage?: number | null;
    us_percentage?: number | null;
    imc_percentage?: number | null;
    created_at: DateString;
    isActive?: boolean | null;
  } & People_Key)[];
}
```
### Using `ListPeople`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listPeople } from '@dataconnect/generated-server';


// Call the `listPeople()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listPeople();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listPeople(dataConnect);

console.log(data.peoples);

// Or, you can use the `Promise` API.
listPeople().then((response) => {
  const data = response.data;
  console.log(data.peoples);
});
```

### Using `ListPeople`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listPeopleRef } from '@dataconnect/generated-server';


// Call the `listPeopleRef()` function to get a reference to the query.
const ref = listPeopleRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listPeopleRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.peoples);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.peoples);
});
```

## ListRoles
You can execute the `ListRoles` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listRoles(options?: ExecuteQueryOptions): QueryPromise<ListRolesData, undefined>;

interface ListRolesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListRolesData, undefined>;
}
export const listRolesRef: ListRolesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listRoles(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListRolesData, undefined>;

interface ListRolesRef {
  ...
  (dc: DataConnect): QueryRef<ListRolesData, undefined>;
}
export const listRolesRef: ListRolesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listRolesRef:
```typescript
const name = listRolesRef.operationName;
console.log(name);
```

### Variables
The `ListRoles` query has no variables.
### Return Type
Recall that executing the `ListRoles` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListRolesData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListRolesData {
  roless: ({
    id: UUIDString;
    name: string;
    billable_capacity_hours: number;
  } & Roles_Key)[];
}
```
### Using `ListRoles`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listRoles } from '@dataconnect/generated-server';


// Call the `listRoles()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listRoles();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listRoles(dataConnect);

console.log(data.roless);

// Or, you can use the `Promise` API.
listRoles().then((response) => {
  const data = response.data;
  console.log(data.roless);
});
```

### Using `ListRoles`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listRolesRef } from '@dataconnect/generated-server';


// Call the `listRolesRef()` function to get a reference to the query.
const ref = listRolesRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listRolesRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.roless);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.roless);
});
```

## ListRateCards
You can execute the `ListRateCards` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listRateCards(options?: ExecuteQueryOptions): QueryPromise<ListRateCardsData, undefined>;

interface ListRateCardsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListRateCardsData, undefined>;
}
export const listRateCardsRef: ListRateCardsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listRateCards(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListRateCardsData, undefined>;

interface ListRateCardsRef {
  ...
  (dc: DataConnect): QueryRef<ListRateCardsData, undefined>;
}
export const listRateCardsRef: ListRateCardsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listRateCardsRef:
```typescript
const name = listRateCardsRef.operationName;
console.log(name);
```

### Variables
The `ListRateCards` query has no variables.
### Return Type
Recall that executing the `ListRateCards` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListRateCardsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListRateCardsData {
  rateCardss: ({
    id: UUIDString;
    name: string;
    hourly_rate: number;
    currency: string;
    role_id?: UUIDString | null;
  } & RateCards_Key)[];
}
```
### Using `ListRateCards`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listRateCards } from '@dataconnect/generated-server';


// Call the `listRateCards()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listRateCards();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listRateCards(dataConnect);

console.log(data.rateCardss);

// Or, you can use the `Promise` API.
listRateCards().then((response) => {
  const data = response.data;
  console.log(data.rateCardss);
});
```

### Using `ListRateCards`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listRateCardsRef } from '@dataconnect/generated-server';


// Call the `listRateCardsRef()` function to get a reference to the query.
const ref = listRateCardsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listRateCardsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.rateCardss);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.rateCardss);
});
```

## ListTimeEntries
You can execute the `ListTimeEntries` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listTimeEntries(options?: ExecuteQueryOptions): QueryPromise<ListTimeEntriesData, undefined>;

interface ListTimeEntriesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListTimeEntriesData, undefined>;
}
export const listTimeEntriesRef: ListTimeEntriesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listTimeEntries(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListTimeEntriesData, undefined>;

interface ListTimeEntriesRef {
  ...
  (dc: DataConnect): QueryRef<ListTimeEntriesData, undefined>;
}
export const listTimeEntriesRef: ListTimeEntriesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listTimeEntriesRef:
```typescript
const name = listTimeEntriesRef.operationName;
console.log(name);
```

### Variables
The `ListTimeEntries` query has no variables.
### Return Type
Recall that executing the `ListTimeEntries` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListTimeEntriesData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListTimeEntriesData {
  timeEntriess: ({
    id: UUIDString;
    date: DateString;
    hours: number;
    notes?: string | null;
    project_id?: UUIDString | null;
    person_id?: UUIDString | null;
  } & TimeEntries_Key)[];
}
```
### Using `ListTimeEntries`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listTimeEntries } from '@dataconnect/generated-server';


// Call the `listTimeEntries()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listTimeEntries();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listTimeEntries(dataConnect);

console.log(data.timeEntriess);

// Or, you can use the `Promise` API.
listTimeEntries().then((response) => {
  const data = response.data;
  console.log(data.timeEntriess);
});
```

### Using `ListTimeEntries`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listTimeEntriesRef } from '@dataconnect/generated-server';


// Call the `listTimeEntriesRef()` function to get a reference to the query.
const ref = listTimeEntriesRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listTimeEntriesRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.timeEntriess);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.timeEntriess);
});
```

## ListTimeEntriesByProject
You can execute the `ListTimeEntriesByProject` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listTimeEntriesByProject(vars: ListTimeEntriesByProjectVariables, options?: ExecuteQueryOptions): QueryPromise<ListTimeEntriesByProjectData, ListTimeEntriesByProjectVariables>;

interface ListTimeEntriesByProjectRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListTimeEntriesByProjectVariables): QueryRef<ListTimeEntriesByProjectData, ListTimeEntriesByProjectVariables>;
}
export const listTimeEntriesByProjectRef: ListTimeEntriesByProjectRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listTimeEntriesByProject(dc: DataConnect, vars: ListTimeEntriesByProjectVariables, options?: ExecuteQueryOptions): QueryPromise<ListTimeEntriesByProjectData, ListTimeEntriesByProjectVariables>;

interface ListTimeEntriesByProjectRef {
  ...
  (dc: DataConnect, vars: ListTimeEntriesByProjectVariables): QueryRef<ListTimeEntriesByProjectData, ListTimeEntriesByProjectVariables>;
}
export const listTimeEntriesByProjectRef: ListTimeEntriesByProjectRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listTimeEntriesByProjectRef:
```typescript
const name = listTimeEntriesByProjectRef.operationName;
console.log(name);
```

### Variables
The `ListTimeEntriesByProject` query requires an argument of type `ListTimeEntriesByProjectVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ListTimeEntriesByProjectVariables {
  projectId: UUIDString;
}
```
### Return Type
Recall that executing the `ListTimeEntriesByProject` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListTimeEntriesByProjectData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListTimeEntriesByProjectData {
  timeEntriess: ({
    id: UUIDString;
    date: DateString;
    hours: number;
    notes?: string | null;
    project_id?: UUIDString | null;
    person_id?: UUIDString | null;
  } & TimeEntries_Key)[];
}
```
### Using `ListTimeEntriesByProject`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listTimeEntriesByProject, ListTimeEntriesByProjectVariables } from '@dataconnect/generated-server';

// The `ListTimeEntriesByProject` query requires an argument of type `ListTimeEntriesByProjectVariables`:
const listTimeEntriesByProjectVars: ListTimeEntriesByProjectVariables = {
  projectId: ..., 
};

// Call the `listTimeEntriesByProject()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listTimeEntriesByProject(listTimeEntriesByProjectVars);
// Variables can be defined inline as well.
const { data } = await listTimeEntriesByProject({ projectId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listTimeEntriesByProject(dataConnect, listTimeEntriesByProjectVars);

console.log(data.timeEntriess);

// Or, you can use the `Promise` API.
listTimeEntriesByProject(listTimeEntriesByProjectVars).then((response) => {
  const data = response.data;
  console.log(data.timeEntriess);
});
```

### Using `ListTimeEntriesByProject`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listTimeEntriesByProjectRef, ListTimeEntriesByProjectVariables } from '@dataconnect/generated-server';

// The `ListTimeEntriesByProject` query requires an argument of type `ListTimeEntriesByProjectVariables`:
const listTimeEntriesByProjectVars: ListTimeEntriesByProjectVariables = {
  projectId: ..., 
};

// Call the `listTimeEntriesByProjectRef()` function to get a reference to the query.
const ref = listTimeEntriesByProjectRef(listTimeEntriesByProjectVars);
// Variables can be defined inline as well.
const ref = listTimeEntriesByProjectRef({ projectId: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listTimeEntriesByProjectRef(dataConnect, listTimeEntriesByProjectVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.timeEntriess);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.timeEntriess);
});
```

## ListProjectPhases
You can execute the `ListProjectPhases` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listProjectPhases(options?: ExecuteQueryOptions): QueryPromise<ListProjectPhasesData, undefined>;

interface ListProjectPhasesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListProjectPhasesData, undefined>;
}
export const listProjectPhasesRef: ListProjectPhasesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listProjectPhases(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListProjectPhasesData, undefined>;

interface ListProjectPhasesRef {
  ...
  (dc: DataConnect): QueryRef<ListProjectPhasesData, undefined>;
}
export const listProjectPhasesRef: ListProjectPhasesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listProjectPhasesRef:
```typescript
const name = listProjectPhasesRef.operationName;
console.log(name);
```

### Variables
The `ListProjectPhases` query has no variables.
### Return Type
Recall that executing the `ListProjectPhases` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListProjectPhasesData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListProjectPhasesData {
  projectPhasess: ({
    id: UUIDString;
    project_id: UUIDString;
    phase_name: string;
    start_date?: DateString | null;
    end_date?: DateString | null;
    sort_order: number;
  } & ProjectPhases_Key)[];
}
```
### Using `ListProjectPhases`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listProjectPhases } from '@dataconnect/generated-server';


// Call the `listProjectPhases()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listProjectPhases();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listProjectPhases(dataConnect);

console.log(data.projectPhasess);

// Or, you can use the `Promise` API.
listProjectPhases().then((response) => {
  const data = response.data;
  console.log(data.projectPhasess);
});
```

### Using `ListProjectPhases`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listProjectPhasesRef } from '@dataconnect/generated-server';


// Call the `listProjectPhasesRef()` function to get a reference to the query.
const ref = listProjectPhasesRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listProjectPhasesRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.projectPhasess);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.projectPhasess);
});
```

## ListAllocations
You can execute the `ListAllocations` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listAllocations(options?: ExecuteQueryOptions): QueryPromise<ListAllocationsData, undefined>;

interface ListAllocationsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListAllocationsData, undefined>;
}
export const listAllocationsRef: ListAllocationsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listAllocations(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListAllocationsData, undefined>;

interface ListAllocationsRef {
  ...
  (dc: DataConnect): QueryRef<ListAllocationsData, undefined>;
}
export const listAllocationsRef: ListAllocationsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listAllocationsRef:
```typescript
const name = listAllocationsRef.operationName;
console.log(name);
```

### Variables
The `ListAllocations` query has no variables.
### Return Type
Recall that executing the `ListAllocations` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListAllocationsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListAllocationsData {
  allocationss: ({
    id: UUIDString;
    person_id?: UUIDString | null;
    project_scope_id?: UUIDString | null;
    allocated_hours: number;
  } & Allocations_Key)[];
}
```
### Using `ListAllocations`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listAllocations } from '@dataconnect/generated-server';


// Call the `listAllocations()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listAllocations();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listAllocations(dataConnect);

console.log(data.allocationss);

// Or, you can use the `Promise` API.
listAllocations().then((response) => {
  const data = response.data;
  console.log(data.allocationss);
});
```

### Using `ListAllocations`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listAllocationsRef } from '@dataconnect/generated-server';


// Call the `listAllocationsRef()` function to get a reference to the query.
const ref = listAllocationsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listAllocationsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.allocationss);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.allocationss);
});
```

## ListDataImports
You can execute the `ListDataImports` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listDataImports(options?: ExecuteQueryOptions): QueryPromise<ListDataImportsData, undefined>;

interface ListDataImportsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListDataImportsData, undefined>;
}
export const listDataImportsRef: ListDataImportsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listDataImports(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListDataImportsData, undefined>;

interface ListDataImportsRef {
  ...
  (dc: DataConnect): QueryRef<ListDataImportsData, undefined>;
}
export const listDataImportsRef: ListDataImportsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listDataImportsRef:
```typescript
const name = listDataImportsRef.operationName;
console.log(name);
```

### Variables
The `ListDataImports` query has no variables.
### Return Type
Recall that executing the `ListDataImports` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListDataImportsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListDataImportsData {
  dataImportss: ({
    dataset: string;
    last_imported_at: string;
    row_count: number;
  })[];
}
```
### Using `ListDataImports`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listDataImports } from '@dataconnect/generated-server';


// Call the `listDataImports()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listDataImports();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listDataImports(dataConnect);

console.log(data.dataImportss);

// Or, you can use the `Promise` API.
listDataImports().then((response) => {
  const data = response.data;
  console.log(data.dataImportss);
});
```

### Using `ListDataImports`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listDataImportsRef } from '@dataconnect/generated-server';


// Call the `listDataImportsRef()` function to get a reference to the query.
const ref = listDataImportsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listDataImportsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.dataImportss);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.dataImportss);
});
```

## GetAppUserByEmail
You can execute the `GetAppUserByEmail` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getAppUserByEmail(vars: GetAppUserByEmailVariables, options?: ExecuteQueryOptions): QueryPromise<GetAppUserByEmailData, GetAppUserByEmailVariables>;

interface GetAppUserByEmailRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetAppUserByEmailVariables): QueryRef<GetAppUserByEmailData, GetAppUserByEmailVariables>;
}
export const getAppUserByEmailRef: GetAppUserByEmailRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getAppUserByEmail(dc: DataConnect, vars: GetAppUserByEmailVariables, options?: ExecuteQueryOptions): QueryPromise<GetAppUserByEmailData, GetAppUserByEmailVariables>;

interface GetAppUserByEmailRef {
  ...
  (dc: DataConnect, vars: GetAppUserByEmailVariables): QueryRef<GetAppUserByEmailData, GetAppUserByEmailVariables>;
}
export const getAppUserByEmailRef: GetAppUserByEmailRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getAppUserByEmailRef:
```typescript
const name = getAppUserByEmailRef.operationName;
console.log(name);
```

### Variables
The `GetAppUserByEmail` query requires an argument of type `GetAppUserByEmailVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetAppUserByEmailVariables {
  email: string;
}
```
### Return Type
Recall that executing the `GetAppUserByEmail` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetAppUserByEmailData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetAppUserByEmailData {
  appUserss: ({
    id: UUIDString;
    email: string;
    role: string;
    createdAt: DateString;
    addedBy?: string | null;
  } & AppUsers_Key)[];
}
```
### Using `GetAppUserByEmail`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getAppUserByEmail, GetAppUserByEmailVariables } from '@dataconnect/generated-server';

// The `GetAppUserByEmail` query requires an argument of type `GetAppUserByEmailVariables`:
const getAppUserByEmailVars: GetAppUserByEmailVariables = {
  email: ..., 
};

// Call the `getAppUserByEmail()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getAppUserByEmail(getAppUserByEmailVars);
// Variables can be defined inline as well.
const { data } = await getAppUserByEmail({ email: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getAppUserByEmail(dataConnect, getAppUserByEmailVars);

console.log(data.appUserss);

// Or, you can use the `Promise` API.
getAppUserByEmail(getAppUserByEmailVars).then((response) => {
  const data = response.data;
  console.log(data.appUserss);
});
```

### Using `GetAppUserByEmail`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getAppUserByEmailRef, GetAppUserByEmailVariables } from '@dataconnect/generated-server';

// The `GetAppUserByEmail` query requires an argument of type `GetAppUserByEmailVariables`:
const getAppUserByEmailVars: GetAppUserByEmailVariables = {
  email: ..., 
};

// Call the `getAppUserByEmailRef()` function to get a reference to the query.
const ref = getAppUserByEmailRef(getAppUserByEmailVars);
// Variables can be defined inline as well.
const ref = getAppUserByEmailRef({ email: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getAppUserByEmailRef(dataConnect, getAppUserByEmailVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.appUserss);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.appUserss);
});
```

## ListAppUsers
You can execute the `ListAppUsers` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listAppUsers(options?: ExecuteQueryOptions): QueryPromise<ListAppUsersData, undefined>;

interface ListAppUsersRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListAppUsersData, undefined>;
}
export const listAppUsersRef: ListAppUsersRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listAppUsers(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListAppUsersData, undefined>;

interface ListAppUsersRef {
  ...
  (dc: DataConnect): QueryRef<ListAppUsersData, undefined>;
}
export const listAppUsersRef: ListAppUsersRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listAppUsersRef:
```typescript
const name = listAppUsersRef.operationName;
console.log(name);
```

### Variables
The `ListAppUsers` query has no variables.
### Return Type
Recall that executing the `ListAppUsers` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListAppUsersData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListAppUsersData {
  appUserss: ({
    id: UUIDString;
    email: string;
    role: string;
    createdAt: DateString;
    addedBy?: string | null;
  } & AppUsers_Key)[];
}
```
### Using `ListAppUsers`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listAppUsers } from '@dataconnect/generated-server';


// Call the `listAppUsers()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listAppUsers();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listAppUsers(dataConnect);

console.log(data.appUserss);

// Or, you can use the `Promise` API.
listAppUsers().then((response) => {
  const data = response.data;
  console.log(data.appUserss);
});
```

### Using `ListAppUsers`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listAppUsersRef } from '@dataconnect/generated-server';


// Call the `listAppUsersRef()` function to get a reference to the query.
const ref = listAppUsersRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listAppUsersRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.appUserss);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.appUserss);
});
```

## GetOldestTimeEntry
You can execute the `GetOldestTimeEntry` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getOldestTimeEntry(options?: ExecuteQueryOptions): QueryPromise<GetOldestTimeEntryData, undefined>;

interface GetOldestTimeEntryRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetOldestTimeEntryData, undefined>;
}
export const getOldestTimeEntryRef: GetOldestTimeEntryRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getOldestTimeEntry(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetOldestTimeEntryData, undefined>;

interface GetOldestTimeEntryRef {
  ...
  (dc: DataConnect): QueryRef<GetOldestTimeEntryData, undefined>;
}
export const getOldestTimeEntryRef: GetOldestTimeEntryRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getOldestTimeEntryRef:
```typescript
const name = getOldestTimeEntryRef.operationName;
console.log(name);
```

### Variables
The `GetOldestTimeEntry` query has no variables.
### Return Type
Recall that executing the `GetOldestTimeEntry` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetOldestTimeEntryData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetOldestTimeEntryData {
  timeEntriess: ({
    date: DateString;
  })[];
}
```
### Using `GetOldestTimeEntry`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getOldestTimeEntry } from '@dataconnect/generated-server';


// Call the `getOldestTimeEntry()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getOldestTimeEntry();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getOldestTimeEntry(dataConnect);

console.log(data.timeEntriess);

// Or, you can use the `Promise` API.
getOldestTimeEntry().then((response) => {
  const data = response.data;
  console.log(data.timeEntriess);
});
```

### Using `GetOldestTimeEntry`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getOldestTimeEntryRef } from '@dataconnect/generated-server';


// Call the `getOldestTimeEntryRef()` function to get a reference to the query.
const ref = getOldestTimeEntryRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getOldestTimeEntryRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.timeEntriess);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.timeEntriess);
});
```

## GetNewestTimeEntry
You can execute the `GetNewestTimeEntry` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getNewestTimeEntry(options?: ExecuteQueryOptions): QueryPromise<GetNewestTimeEntryData, undefined>;

interface GetNewestTimeEntryRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetNewestTimeEntryData, undefined>;
}
export const getNewestTimeEntryRef: GetNewestTimeEntryRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getNewestTimeEntry(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetNewestTimeEntryData, undefined>;

interface GetNewestTimeEntryRef {
  ...
  (dc: DataConnect): QueryRef<GetNewestTimeEntryData, undefined>;
}
export const getNewestTimeEntryRef: GetNewestTimeEntryRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getNewestTimeEntryRef:
```typescript
const name = getNewestTimeEntryRef.operationName;
console.log(name);
```

### Variables
The `GetNewestTimeEntry` query has no variables.
### Return Type
Recall that executing the `GetNewestTimeEntry` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetNewestTimeEntryData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetNewestTimeEntryData {
  timeEntriess: ({
    date: DateString;
  })[];
}
```
### Using `GetNewestTimeEntry`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getNewestTimeEntry } from '@dataconnect/generated-server';


// Call the `getNewestTimeEntry()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getNewestTimeEntry();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getNewestTimeEntry(dataConnect);

console.log(data.timeEntriess);

// Or, you can use the `Promise` API.
getNewestTimeEntry().then((response) => {
  const data = response.data;
  console.log(data.timeEntriess);
});
```

### Using `GetNewestTimeEntry`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getNewestTimeEntryRef } from '@dataconnect/generated-server';


// Call the `getNewestTimeEntryRef()` function to get a reference to the query.
const ref = getNewestTimeEntryRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getNewestTimeEntryRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.timeEntriess);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.timeEntriess);
});
```

## GetTimeEntriesByDateRange
You can execute the `GetTimeEntriesByDateRange` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getTimeEntriesByDateRange(vars: GetTimeEntriesByDateRangeVariables, options?: ExecuteQueryOptions): QueryPromise<GetTimeEntriesByDateRangeData, GetTimeEntriesByDateRangeVariables>;

interface GetTimeEntriesByDateRangeRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetTimeEntriesByDateRangeVariables): QueryRef<GetTimeEntriesByDateRangeData, GetTimeEntriesByDateRangeVariables>;
}
export const getTimeEntriesByDateRangeRef: GetTimeEntriesByDateRangeRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getTimeEntriesByDateRange(dc: DataConnect, vars: GetTimeEntriesByDateRangeVariables, options?: ExecuteQueryOptions): QueryPromise<GetTimeEntriesByDateRangeData, GetTimeEntriesByDateRangeVariables>;

interface GetTimeEntriesByDateRangeRef {
  ...
  (dc: DataConnect, vars: GetTimeEntriesByDateRangeVariables): QueryRef<GetTimeEntriesByDateRangeData, GetTimeEntriesByDateRangeVariables>;
}
export const getTimeEntriesByDateRangeRef: GetTimeEntriesByDateRangeRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getTimeEntriesByDateRangeRef:
```typescript
const name = getTimeEntriesByDateRangeRef.operationName;
console.log(name);
```

### Variables
The `GetTimeEntriesByDateRange` query requires an argument of type `GetTimeEntriesByDateRangeVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetTimeEntriesByDateRangeVariables {
  startDate: DateString;
  endDate: DateString;
}
```
### Return Type
Recall that executing the `GetTimeEntriesByDateRange` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetTimeEntriesByDateRangeData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetTimeEntriesByDateRangeData {
  timeEntriess: ({
    id: UUIDString;
    date: DateString;
    hours: number;
    notes?: string | null;
    createdAt: DateString;
    project_id?: UUIDString | null;
    person_id?: UUIDString | null;
    personName?: string | null;
    projectName?: string | null;
    projectCode?: string | null;
  } & TimeEntries_Key)[];
}
```
### Using `GetTimeEntriesByDateRange`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getTimeEntriesByDateRange, GetTimeEntriesByDateRangeVariables } from '@dataconnect/generated-server';

// The `GetTimeEntriesByDateRange` query requires an argument of type `GetTimeEntriesByDateRangeVariables`:
const getTimeEntriesByDateRangeVars: GetTimeEntriesByDateRangeVariables = {
  startDate: ..., 
  endDate: ..., 
};

// Call the `getTimeEntriesByDateRange()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getTimeEntriesByDateRange(getTimeEntriesByDateRangeVars);
// Variables can be defined inline as well.
const { data } = await getTimeEntriesByDateRange({ startDate: ..., endDate: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getTimeEntriesByDateRange(dataConnect, getTimeEntriesByDateRangeVars);

console.log(data.timeEntriess);

// Or, you can use the `Promise` API.
getTimeEntriesByDateRange(getTimeEntriesByDateRangeVars).then((response) => {
  const data = response.data;
  console.log(data.timeEntriess);
});
```

### Using `GetTimeEntriesByDateRange`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getTimeEntriesByDateRangeRef, GetTimeEntriesByDateRangeVariables } from '@dataconnect/generated-server';

// The `GetTimeEntriesByDateRange` query requires an argument of type `GetTimeEntriesByDateRangeVariables`:
const getTimeEntriesByDateRangeVars: GetTimeEntriesByDateRangeVariables = {
  startDate: ..., 
  endDate: ..., 
};

// Call the `getTimeEntriesByDateRangeRef()` function to get a reference to the query.
const ref = getTimeEntriesByDateRangeRef(getTimeEntriesByDateRangeVars);
// Variables can be defined inline as well.
const ref = getTimeEntriesByDateRangeRef({ startDate: ..., endDate: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getTimeEntriesByDateRangeRef(dataConnect, getTimeEntriesByDateRangeVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.timeEntriess);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.timeEntriess);
});
```

## GetAllTimeEntries
You can execute the `GetAllTimeEntries` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getAllTimeEntries(options?: ExecuteQueryOptions): QueryPromise<GetAllTimeEntriesData, undefined>;

interface GetAllTimeEntriesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetAllTimeEntriesData, undefined>;
}
export const getAllTimeEntriesRef: GetAllTimeEntriesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getAllTimeEntries(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetAllTimeEntriesData, undefined>;

interface GetAllTimeEntriesRef {
  ...
  (dc: DataConnect): QueryRef<GetAllTimeEntriesData, undefined>;
}
export const getAllTimeEntriesRef: GetAllTimeEntriesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getAllTimeEntriesRef:
```typescript
const name = getAllTimeEntriesRef.operationName;
console.log(name);
```

### Variables
The `GetAllTimeEntries` query has no variables.
### Return Type
Recall that executing the `GetAllTimeEntries` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetAllTimeEntriesData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetAllTimeEntriesData {
  timeEntriess: ({
    id: UUIDString;
    date: DateString;
    hours: number;
    notes?: string | null;
    createdAt: DateString;
    project_id?: UUIDString | null;
    person_id?: UUIDString | null;
    personName?: string | null;
    projectName?: string | null;
    projectCode?: string | null;
  } & TimeEntries_Key)[];
}
```
### Using `GetAllTimeEntries`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getAllTimeEntries } from '@dataconnect/generated-server';


// Call the `getAllTimeEntries()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getAllTimeEntries();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getAllTimeEntries(dataConnect);

console.log(data.timeEntriess);

// Or, you can use the `Promise` API.
getAllTimeEntries().then((response) => {
  const data = response.data;
  console.log(data.timeEntriess);
});
```

### Using `GetAllTimeEntries`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getAllTimeEntriesRef } from '@dataconnect/generated-server';


// Call the `getAllTimeEntriesRef()` function to get a reference to the query.
const ref = getAllTimeEntriesRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getAllTimeEntriesRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.timeEntriess);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.timeEntriess);
});
```

## ListProjectScopes
You can execute the `ListProjectScopes` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listProjectScopes(options?: ExecuteQueryOptions): QueryPromise<ListProjectScopesData, undefined>;

interface ListProjectScopesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListProjectScopesData, undefined>;
}
export const listProjectScopesRef: ListProjectScopesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listProjectScopes(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListProjectScopesData, undefined>;

interface ListProjectScopesRef {
  ...
  (dc: DataConnect): QueryRef<ListProjectScopesData, undefined>;
}
export const listProjectScopesRef: ListProjectScopesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listProjectScopesRef:
```typescript
const name = listProjectScopesRef.operationName;
console.log(name);
```

### Variables
The `ListProjectScopes` query has no variables.
### Return Type
Recall that executing the `ListProjectScopes` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListProjectScopesData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListProjectScopesData {
  projectScopess: ({
    id: UUIDString;
    project_id?: UUIDString | null;
    role_id?: UUIDString | null;
    scoped_hours: number;
    phase_percentages?: unknown | null;
  } & ProjectScopes_Key)[];
}
```
### Using `ListProjectScopes`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listProjectScopes } from '@dataconnect/generated-server';


// Call the `listProjectScopes()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listProjectScopes();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listProjectScopes(dataConnect);

console.log(data.projectScopess);

// Or, you can use the `Promise` API.
listProjectScopes().then((response) => {
  const data = response.data;
  console.log(data.projectScopess);
});
```

### Using `ListProjectScopes`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listProjectScopesRef } from '@dataconnect/generated-server';


// Call the `listProjectScopesRef()` function to get a reference to the query.
const ref = listProjectScopesRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listProjectScopesRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.projectScopess);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.projectScopess);
});
```

## ListBillabilityRules
You can execute the `ListBillabilityRules` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listBillabilityRules(options?: ExecuteQueryOptions): QueryPromise<ListBillabilityRulesData, undefined>;

interface ListBillabilityRulesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListBillabilityRulesData, undefined>;
}
export const listBillabilityRulesRef: ListBillabilityRulesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listBillabilityRules(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListBillabilityRulesData, undefined>;

interface ListBillabilityRulesRef {
  ...
  (dc: DataConnect): QueryRef<ListBillabilityRulesData, undefined>;
}
export const listBillabilityRulesRef: ListBillabilityRulesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listBillabilityRulesRef:
```typescript
const name = listBillabilityRulesRef.operationName;
console.log(name);
```

### Variables
The `ListBillabilityRules` query has no variables.
### Return Type
Recall that executing the `ListBillabilityRules` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListBillabilityRulesData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListBillabilityRulesData {
  billabilityRuless: ({
    id: UUIDString;
    is_billable: boolean;
    logic_operator: string;
    name: string;
    priority: number;
    createdAt: DateString;
  } & BillabilityRules_Key)[];
}
```
### Using `ListBillabilityRules`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listBillabilityRules } from '@dataconnect/generated-server';


// Call the `listBillabilityRules()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listBillabilityRules();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listBillabilityRules(dataConnect);

console.log(data.billabilityRuless);

// Or, you can use the `Promise` API.
listBillabilityRules().then((response) => {
  const data = response.data;
  console.log(data.billabilityRuless);
});
```

### Using `ListBillabilityRules`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listBillabilityRulesRef } from '@dataconnect/generated-server';


// Call the `listBillabilityRulesRef()` function to get a reference to the query.
const ref = listBillabilityRulesRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listBillabilityRulesRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.billabilityRuless);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.billabilityRuless);
});
```

## ListBillabilityRuleConditions
You can execute the `ListBillabilityRuleConditions` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listBillabilityRuleConditions(options?: ExecuteQueryOptions): QueryPromise<ListBillabilityRuleConditionsData, undefined>;

interface ListBillabilityRuleConditionsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListBillabilityRuleConditionsData, undefined>;
}
export const listBillabilityRuleConditionsRef: ListBillabilityRuleConditionsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listBillabilityRuleConditions(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListBillabilityRuleConditionsData, undefined>;

interface ListBillabilityRuleConditionsRef {
  ...
  (dc: DataConnect): QueryRef<ListBillabilityRuleConditionsData, undefined>;
}
export const listBillabilityRuleConditionsRef: ListBillabilityRuleConditionsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listBillabilityRuleConditionsRef:
```typescript
const name = listBillabilityRuleConditionsRef.operationName;
console.log(name);
```

### Variables
The `ListBillabilityRuleConditions` query has no variables.
### Return Type
Recall that executing the `ListBillabilityRuleConditions` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListBillabilityRuleConditionsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListBillabilityRuleConditionsData {
  billabilityRuleConditionss: ({
    id: UUIDString;
    field: string;
    logic_operator: string;
    operator: string;
    rule_id: UUIDString;
    value: string;
    createdAt: DateString;
  } & BillabilityRuleConditions_Key)[];
}
```
### Using `ListBillabilityRuleConditions`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listBillabilityRuleConditions } from '@dataconnect/generated-server';


// Call the `listBillabilityRuleConditions()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listBillabilityRuleConditions();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listBillabilityRuleConditions(dataConnect);

console.log(data.billabilityRuleConditionss);

// Or, you can use the `Promise` API.
listBillabilityRuleConditions().then((response) => {
  const data = response.data;
  console.log(data.billabilityRuleConditionss);
});
```

### Using `ListBillabilityRuleConditions`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listBillabilityRuleConditionsRef } from '@dataconnect/generated-server';


// Call the `listBillabilityRuleConditionsRef()` function to get a reference to the query.
const ref = listBillabilityRuleConditionsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listBillabilityRuleConditionsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.billabilityRuleConditionss);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.billabilityRuleConditionss);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## InsertAllocations
You can execute the `InsertAllocations` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
insertAllocations(vars: InsertAllocationsVariables): MutationPromise<InsertAllocationsData, InsertAllocationsVariables>;

interface InsertAllocationsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertAllocationsVariables): MutationRef<InsertAllocationsData, InsertAllocationsVariables>;
}
export const insertAllocationsRef: InsertAllocationsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
insertAllocations(dc: DataConnect, vars: InsertAllocationsVariables): MutationPromise<InsertAllocationsData, InsertAllocationsVariables>;

interface InsertAllocationsRef {
  ...
  (dc: DataConnect, vars: InsertAllocationsVariables): MutationRef<InsertAllocationsData, InsertAllocationsVariables>;
}
export const insertAllocationsRef: InsertAllocationsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the insertAllocationsRef:
```typescript
const name = insertAllocationsRef.operationName;
console.log(name);
```

### Variables
The `InsertAllocations` mutation requires an argument of type `InsertAllocationsVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface InsertAllocationsVariables {
  allocatedHours: number;
  createdAt: DateString;
  id: UUIDString;
  personId?: UUIDString | null;
  projectScopeId?: UUIDString | null;
}
```
### Return Type
Recall that executing the `InsertAllocations` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `InsertAllocationsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface InsertAllocationsData {
  allocations_insert: Allocations_Key;
}
```
### Using `InsertAllocations`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, insertAllocations, InsertAllocationsVariables } from '@dataconnect/generated-server';

// The `InsertAllocations` mutation requires an argument of type `InsertAllocationsVariables`:
const insertAllocationsVars: InsertAllocationsVariables = {
  allocatedHours: ..., 
  createdAt: ..., 
  id: ..., 
  personId: ..., // optional
  projectScopeId: ..., // optional
};

// Call the `insertAllocations()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await insertAllocations(insertAllocationsVars);
// Variables can be defined inline as well.
const { data } = await insertAllocations({ allocatedHours: ..., createdAt: ..., id: ..., personId: ..., projectScopeId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await insertAllocations(dataConnect, insertAllocationsVars);

console.log(data.allocations_insert);

// Or, you can use the `Promise` API.
insertAllocations(insertAllocationsVars).then((response) => {
  const data = response.data;
  console.log(data.allocations_insert);
});
```

### Using `InsertAllocations`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, insertAllocationsRef, InsertAllocationsVariables } from '@dataconnect/generated-server';

// The `InsertAllocations` mutation requires an argument of type `InsertAllocationsVariables`:
const insertAllocationsVars: InsertAllocationsVariables = {
  allocatedHours: ..., 
  createdAt: ..., 
  id: ..., 
  personId: ..., // optional
  projectScopeId: ..., // optional
};

// Call the `insertAllocationsRef()` function to get a reference to the mutation.
const ref = insertAllocationsRef(insertAllocationsVars);
// Variables can be defined inline as well.
const ref = insertAllocationsRef({ allocatedHours: ..., createdAt: ..., id: ..., personId: ..., projectScopeId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = insertAllocationsRef(dataConnect, insertAllocationsVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.allocations_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.allocations_insert);
});
```

## UpsertAllocations
You can execute the `UpsertAllocations` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
upsertAllocations(vars: UpsertAllocationsVariables): MutationPromise<UpsertAllocationsData, UpsertAllocationsVariables>;

interface UpsertAllocationsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertAllocationsVariables): MutationRef<UpsertAllocationsData, UpsertAllocationsVariables>;
}
export const upsertAllocationsRef: UpsertAllocationsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
upsertAllocations(dc: DataConnect, vars: UpsertAllocationsVariables): MutationPromise<UpsertAllocationsData, UpsertAllocationsVariables>;

interface UpsertAllocationsRef {
  ...
  (dc: DataConnect, vars: UpsertAllocationsVariables): MutationRef<UpsertAllocationsData, UpsertAllocationsVariables>;
}
export const upsertAllocationsRef: UpsertAllocationsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the upsertAllocationsRef:
```typescript
const name = upsertAllocationsRef.operationName;
console.log(name);
```

### Variables
The `UpsertAllocations` mutation requires an argument of type `UpsertAllocationsVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpsertAllocationsVariables {
  allocatedHours: number;
  createdAt: DateString;
  id: UUIDString;
  personId?: UUIDString | null;
  projectScopeId?: UUIDString | null;
}
```
### Return Type
Recall that executing the `UpsertAllocations` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpsertAllocationsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpsertAllocationsData {
  allocations_upsert: Allocations_Key;
}
```
### Using `UpsertAllocations`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, upsertAllocations, UpsertAllocationsVariables } from '@dataconnect/generated-server';

// The `UpsertAllocations` mutation requires an argument of type `UpsertAllocationsVariables`:
const upsertAllocationsVars: UpsertAllocationsVariables = {
  allocatedHours: ..., 
  createdAt: ..., 
  id: ..., 
  personId: ..., // optional
  projectScopeId: ..., // optional
};

// Call the `upsertAllocations()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await upsertAllocations(upsertAllocationsVars);
// Variables can be defined inline as well.
const { data } = await upsertAllocations({ allocatedHours: ..., createdAt: ..., id: ..., personId: ..., projectScopeId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await upsertAllocations(dataConnect, upsertAllocationsVars);

console.log(data.allocations_upsert);

// Or, you can use the `Promise` API.
upsertAllocations(upsertAllocationsVars).then((response) => {
  const data = response.data;
  console.log(data.allocations_upsert);
});
```

### Using `UpsertAllocations`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, upsertAllocationsRef, UpsertAllocationsVariables } from '@dataconnect/generated-server';

// The `UpsertAllocations` mutation requires an argument of type `UpsertAllocationsVariables`:
const upsertAllocationsVars: UpsertAllocationsVariables = {
  allocatedHours: ..., 
  createdAt: ..., 
  id: ..., 
  personId: ..., // optional
  projectScopeId: ..., // optional
};

// Call the `upsertAllocationsRef()` function to get a reference to the mutation.
const ref = upsertAllocationsRef(upsertAllocationsVars);
// Variables can be defined inline as well.
const ref = upsertAllocationsRef({ allocatedHours: ..., createdAt: ..., id: ..., personId: ..., projectScopeId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = upsertAllocationsRef(dataConnect, upsertAllocationsVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.allocations_upsert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.allocations_upsert);
});
```

## InsertBillabilityRuleConditions
You can execute the `InsertBillabilityRuleConditions` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
insertBillabilityRuleConditions(vars: InsertBillabilityRuleConditionsVariables): MutationPromise<InsertBillabilityRuleConditionsData, InsertBillabilityRuleConditionsVariables>;

interface InsertBillabilityRuleConditionsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertBillabilityRuleConditionsVariables): MutationRef<InsertBillabilityRuleConditionsData, InsertBillabilityRuleConditionsVariables>;
}
export const insertBillabilityRuleConditionsRef: InsertBillabilityRuleConditionsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
insertBillabilityRuleConditions(dc: DataConnect, vars: InsertBillabilityRuleConditionsVariables): MutationPromise<InsertBillabilityRuleConditionsData, InsertBillabilityRuleConditionsVariables>;

interface InsertBillabilityRuleConditionsRef {
  ...
  (dc: DataConnect, vars: InsertBillabilityRuleConditionsVariables): MutationRef<InsertBillabilityRuleConditionsData, InsertBillabilityRuleConditionsVariables>;
}
export const insertBillabilityRuleConditionsRef: InsertBillabilityRuleConditionsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the insertBillabilityRuleConditionsRef:
```typescript
const name = insertBillabilityRuleConditionsRef.operationName;
console.log(name);
```

### Variables
The `InsertBillabilityRuleConditions` mutation requires an argument of type `InsertBillabilityRuleConditionsVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface InsertBillabilityRuleConditionsVariables {
  createdAt: DateString;
  field: string;
  id: UUIDString;
  logicOperator: string;
  operator: string;
  ruleId: UUIDString;
  value: string;
}
```
### Return Type
Recall that executing the `InsertBillabilityRuleConditions` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `InsertBillabilityRuleConditionsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface InsertBillabilityRuleConditionsData {
  billabilityRuleConditions_insert: BillabilityRuleConditions_Key;
}
```
### Using `InsertBillabilityRuleConditions`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, insertBillabilityRuleConditions, InsertBillabilityRuleConditionsVariables } from '@dataconnect/generated-server';

// The `InsertBillabilityRuleConditions` mutation requires an argument of type `InsertBillabilityRuleConditionsVariables`:
const insertBillabilityRuleConditionsVars: InsertBillabilityRuleConditionsVariables = {
  createdAt: ..., 
  field: ..., 
  id: ..., 
  logicOperator: ..., 
  operator: ..., 
  ruleId: ..., 
  value: ..., 
};

// Call the `insertBillabilityRuleConditions()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await insertBillabilityRuleConditions(insertBillabilityRuleConditionsVars);
// Variables can be defined inline as well.
const { data } = await insertBillabilityRuleConditions({ createdAt: ..., field: ..., id: ..., logicOperator: ..., operator: ..., ruleId: ..., value: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await insertBillabilityRuleConditions(dataConnect, insertBillabilityRuleConditionsVars);

console.log(data.billabilityRuleConditions_insert);

// Or, you can use the `Promise` API.
insertBillabilityRuleConditions(insertBillabilityRuleConditionsVars).then((response) => {
  const data = response.data;
  console.log(data.billabilityRuleConditions_insert);
});
```

### Using `InsertBillabilityRuleConditions`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, insertBillabilityRuleConditionsRef, InsertBillabilityRuleConditionsVariables } from '@dataconnect/generated-server';

// The `InsertBillabilityRuleConditions` mutation requires an argument of type `InsertBillabilityRuleConditionsVariables`:
const insertBillabilityRuleConditionsVars: InsertBillabilityRuleConditionsVariables = {
  createdAt: ..., 
  field: ..., 
  id: ..., 
  logicOperator: ..., 
  operator: ..., 
  ruleId: ..., 
  value: ..., 
};

// Call the `insertBillabilityRuleConditionsRef()` function to get a reference to the mutation.
const ref = insertBillabilityRuleConditionsRef(insertBillabilityRuleConditionsVars);
// Variables can be defined inline as well.
const ref = insertBillabilityRuleConditionsRef({ createdAt: ..., field: ..., id: ..., logicOperator: ..., operator: ..., ruleId: ..., value: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = insertBillabilityRuleConditionsRef(dataConnect, insertBillabilityRuleConditionsVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.billabilityRuleConditions_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.billabilityRuleConditions_insert);
});
```

## UpsertBillabilityRuleConditions
You can execute the `UpsertBillabilityRuleConditions` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
upsertBillabilityRuleConditions(vars: UpsertBillabilityRuleConditionsVariables): MutationPromise<UpsertBillabilityRuleConditionsData, UpsertBillabilityRuleConditionsVariables>;

interface UpsertBillabilityRuleConditionsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertBillabilityRuleConditionsVariables): MutationRef<UpsertBillabilityRuleConditionsData, UpsertBillabilityRuleConditionsVariables>;
}
export const upsertBillabilityRuleConditionsRef: UpsertBillabilityRuleConditionsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
upsertBillabilityRuleConditions(dc: DataConnect, vars: UpsertBillabilityRuleConditionsVariables): MutationPromise<UpsertBillabilityRuleConditionsData, UpsertBillabilityRuleConditionsVariables>;

interface UpsertBillabilityRuleConditionsRef {
  ...
  (dc: DataConnect, vars: UpsertBillabilityRuleConditionsVariables): MutationRef<UpsertBillabilityRuleConditionsData, UpsertBillabilityRuleConditionsVariables>;
}
export const upsertBillabilityRuleConditionsRef: UpsertBillabilityRuleConditionsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the upsertBillabilityRuleConditionsRef:
```typescript
const name = upsertBillabilityRuleConditionsRef.operationName;
console.log(name);
```

### Variables
The `UpsertBillabilityRuleConditions` mutation requires an argument of type `UpsertBillabilityRuleConditionsVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpsertBillabilityRuleConditionsVariables {
  createdAt: DateString;
  field: string;
  id: UUIDString;
  logicOperator: string;
  operator: string;
  ruleId: UUIDString;
  value: string;
}
```
### Return Type
Recall that executing the `UpsertBillabilityRuleConditions` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpsertBillabilityRuleConditionsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpsertBillabilityRuleConditionsData {
  billabilityRuleConditions_upsert: BillabilityRuleConditions_Key;
}
```
### Using `UpsertBillabilityRuleConditions`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, upsertBillabilityRuleConditions, UpsertBillabilityRuleConditionsVariables } from '@dataconnect/generated-server';

// The `UpsertBillabilityRuleConditions` mutation requires an argument of type `UpsertBillabilityRuleConditionsVariables`:
const upsertBillabilityRuleConditionsVars: UpsertBillabilityRuleConditionsVariables = {
  createdAt: ..., 
  field: ..., 
  id: ..., 
  logicOperator: ..., 
  operator: ..., 
  ruleId: ..., 
  value: ..., 
};

// Call the `upsertBillabilityRuleConditions()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await upsertBillabilityRuleConditions(upsertBillabilityRuleConditionsVars);
// Variables can be defined inline as well.
const { data } = await upsertBillabilityRuleConditions({ createdAt: ..., field: ..., id: ..., logicOperator: ..., operator: ..., ruleId: ..., value: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await upsertBillabilityRuleConditions(dataConnect, upsertBillabilityRuleConditionsVars);

console.log(data.billabilityRuleConditions_upsert);

// Or, you can use the `Promise` API.
upsertBillabilityRuleConditions(upsertBillabilityRuleConditionsVars).then((response) => {
  const data = response.data;
  console.log(data.billabilityRuleConditions_upsert);
});
```

### Using `UpsertBillabilityRuleConditions`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, upsertBillabilityRuleConditionsRef, UpsertBillabilityRuleConditionsVariables } from '@dataconnect/generated-server';

// The `UpsertBillabilityRuleConditions` mutation requires an argument of type `UpsertBillabilityRuleConditionsVariables`:
const upsertBillabilityRuleConditionsVars: UpsertBillabilityRuleConditionsVariables = {
  createdAt: ..., 
  field: ..., 
  id: ..., 
  logicOperator: ..., 
  operator: ..., 
  ruleId: ..., 
  value: ..., 
};

// Call the `upsertBillabilityRuleConditionsRef()` function to get a reference to the mutation.
const ref = upsertBillabilityRuleConditionsRef(upsertBillabilityRuleConditionsVars);
// Variables can be defined inline as well.
const ref = upsertBillabilityRuleConditionsRef({ createdAt: ..., field: ..., id: ..., logicOperator: ..., operator: ..., ruleId: ..., value: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = upsertBillabilityRuleConditionsRef(dataConnect, upsertBillabilityRuleConditionsVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.billabilityRuleConditions_upsert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.billabilityRuleConditions_upsert);
});
```

## InsertBillabilityRules
You can execute the `InsertBillabilityRules` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
insertBillabilityRules(vars: InsertBillabilityRulesVariables): MutationPromise<InsertBillabilityRulesData, InsertBillabilityRulesVariables>;

interface InsertBillabilityRulesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertBillabilityRulesVariables): MutationRef<InsertBillabilityRulesData, InsertBillabilityRulesVariables>;
}
export const insertBillabilityRulesRef: InsertBillabilityRulesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
insertBillabilityRules(dc: DataConnect, vars: InsertBillabilityRulesVariables): MutationPromise<InsertBillabilityRulesData, InsertBillabilityRulesVariables>;

interface InsertBillabilityRulesRef {
  ...
  (dc: DataConnect, vars: InsertBillabilityRulesVariables): MutationRef<InsertBillabilityRulesData, InsertBillabilityRulesVariables>;
}
export const insertBillabilityRulesRef: InsertBillabilityRulesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the insertBillabilityRulesRef:
```typescript
const name = insertBillabilityRulesRef.operationName;
console.log(name);
```

### Variables
The `InsertBillabilityRules` mutation requires an argument of type `InsertBillabilityRulesVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface InsertBillabilityRulesVariables {
  createdAt: DateString;
  id: UUIDString;
  isBillable: boolean;
  logicOperator: string;
  name: string;
  priority: number;
}
```
### Return Type
Recall that executing the `InsertBillabilityRules` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `InsertBillabilityRulesData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface InsertBillabilityRulesData {
  billabilityRules_insert: BillabilityRules_Key;
}
```
### Using `InsertBillabilityRules`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, insertBillabilityRules, InsertBillabilityRulesVariables } from '@dataconnect/generated-server';

// The `InsertBillabilityRules` mutation requires an argument of type `InsertBillabilityRulesVariables`:
const insertBillabilityRulesVars: InsertBillabilityRulesVariables = {
  createdAt: ..., 
  id: ..., 
  isBillable: ..., 
  logicOperator: ..., 
  name: ..., 
  priority: ..., 
};

// Call the `insertBillabilityRules()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await insertBillabilityRules(insertBillabilityRulesVars);
// Variables can be defined inline as well.
const { data } = await insertBillabilityRules({ createdAt: ..., id: ..., isBillable: ..., logicOperator: ..., name: ..., priority: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await insertBillabilityRules(dataConnect, insertBillabilityRulesVars);

console.log(data.billabilityRules_insert);

// Or, you can use the `Promise` API.
insertBillabilityRules(insertBillabilityRulesVars).then((response) => {
  const data = response.data;
  console.log(data.billabilityRules_insert);
});
```

### Using `InsertBillabilityRules`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, insertBillabilityRulesRef, InsertBillabilityRulesVariables } from '@dataconnect/generated-server';

// The `InsertBillabilityRules` mutation requires an argument of type `InsertBillabilityRulesVariables`:
const insertBillabilityRulesVars: InsertBillabilityRulesVariables = {
  createdAt: ..., 
  id: ..., 
  isBillable: ..., 
  logicOperator: ..., 
  name: ..., 
  priority: ..., 
};

// Call the `insertBillabilityRulesRef()` function to get a reference to the mutation.
const ref = insertBillabilityRulesRef(insertBillabilityRulesVars);
// Variables can be defined inline as well.
const ref = insertBillabilityRulesRef({ createdAt: ..., id: ..., isBillable: ..., logicOperator: ..., name: ..., priority: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = insertBillabilityRulesRef(dataConnect, insertBillabilityRulesVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.billabilityRules_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.billabilityRules_insert);
});
```

## UpsertBillabilityRules
You can execute the `UpsertBillabilityRules` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
upsertBillabilityRules(vars: UpsertBillabilityRulesVariables): MutationPromise<UpsertBillabilityRulesData, UpsertBillabilityRulesVariables>;

interface UpsertBillabilityRulesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertBillabilityRulesVariables): MutationRef<UpsertBillabilityRulesData, UpsertBillabilityRulesVariables>;
}
export const upsertBillabilityRulesRef: UpsertBillabilityRulesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
upsertBillabilityRules(dc: DataConnect, vars: UpsertBillabilityRulesVariables): MutationPromise<UpsertBillabilityRulesData, UpsertBillabilityRulesVariables>;

interface UpsertBillabilityRulesRef {
  ...
  (dc: DataConnect, vars: UpsertBillabilityRulesVariables): MutationRef<UpsertBillabilityRulesData, UpsertBillabilityRulesVariables>;
}
export const upsertBillabilityRulesRef: UpsertBillabilityRulesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the upsertBillabilityRulesRef:
```typescript
const name = upsertBillabilityRulesRef.operationName;
console.log(name);
```

### Variables
The `UpsertBillabilityRules` mutation requires an argument of type `UpsertBillabilityRulesVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpsertBillabilityRulesVariables {
  createdAt: DateString;
  id: UUIDString;
  isBillable: boolean;
  logicOperator: string;
  name: string;
  priority: number;
}
```
### Return Type
Recall that executing the `UpsertBillabilityRules` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpsertBillabilityRulesData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpsertBillabilityRulesData {
  billabilityRules_upsert: BillabilityRules_Key;
}
```
### Using `UpsertBillabilityRules`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, upsertBillabilityRules, UpsertBillabilityRulesVariables } from '@dataconnect/generated-server';

// The `UpsertBillabilityRules` mutation requires an argument of type `UpsertBillabilityRulesVariables`:
const upsertBillabilityRulesVars: UpsertBillabilityRulesVariables = {
  createdAt: ..., 
  id: ..., 
  isBillable: ..., 
  logicOperator: ..., 
  name: ..., 
  priority: ..., 
};

// Call the `upsertBillabilityRules()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await upsertBillabilityRules(upsertBillabilityRulesVars);
// Variables can be defined inline as well.
const { data } = await upsertBillabilityRules({ createdAt: ..., id: ..., isBillable: ..., logicOperator: ..., name: ..., priority: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await upsertBillabilityRules(dataConnect, upsertBillabilityRulesVars);

console.log(data.billabilityRules_upsert);

// Or, you can use the `Promise` API.
upsertBillabilityRules(upsertBillabilityRulesVars).then((response) => {
  const data = response.data;
  console.log(data.billabilityRules_upsert);
});
```

### Using `UpsertBillabilityRules`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, upsertBillabilityRulesRef, UpsertBillabilityRulesVariables } from '@dataconnect/generated-server';

// The `UpsertBillabilityRules` mutation requires an argument of type `UpsertBillabilityRulesVariables`:
const upsertBillabilityRulesVars: UpsertBillabilityRulesVariables = {
  createdAt: ..., 
  id: ..., 
  isBillable: ..., 
  logicOperator: ..., 
  name: ..., 
  priority: ..., 
};

// Call the `upsertBillabilityRulesRef()` function to get a reference to the mutation.
const ref = upsertBillabilityRulesRef(upsertBillabilityRulesVars);
// Variables can be defined inline as well.
const ref = upsertBillabilityRulesRef({ createdAt: ..., id: ..., isBillable: ..., logicOperator: ..., name: ..., priority: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = upsertBillabilityRulesRef(dataConnect, upsertBillabilityRulesVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.billabilityRules_upsert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.billabilityRules_upsert);
});
```

## InsertClientTeamAllocations
You can execute the `InsertClientTeamAllocations` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
insertClientTeamAllocations(vars: InsertClientTeamAllocationsVariables): MutationPromise<InsertClientTeamAllocationsData, InsertClientTeamAllocationsVariables>;

interface InsertClientTeamAllocationsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertClientTeamAllocationsVariables): MutationRef<InsertClientTeamAllocationsData, InsertClientTeamAllocationsVariables>;
}
export const insertClientTeamAllocationsRef: InsertClientTeamAllocationsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
insertClientTeamAllocations(dc: DataConnect, vars: InsertClientTeamAllocationsVariables): MutationPromise<InsertClientTeamAllocationsData, InsertClientTeamAllocationsVariables>;

interface InsertClientTeamAllocationsRef {
  ...
  (dc: DataConnect, vars: InsertClientTeamAllocationsVariables): MutationRef<InsertClientTeamAllocationsData, InsertClientTeamAllocationsVariables>;
}
export const insertClientTeamAllocationsRef: InsertClientTeamAllocationsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the insertClientTeamAllocationsRef:
```typescript
const name = insertClientTeamAllocationsRef.operationName;
console.log(name);
```

### Variables
The `InsertClientTeamAllocations` mutation requires an argument of type `InsertClientTeamAllocationsVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface InsertClientTeamAllocationsVariables {
  clientName: string;
  createdAt: DateString;
  id: UUIDString;
  personId: UUIDString;
  priority: number;
  roleId: UUIDString;
}
```
### Return Type
Recall that executing the `InsertClientTeamAllocations` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `InsertClientTeamAllocationsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface InsertClientTeamAllocationsData {
  clientTeamAllocations_insert: ClientTeamAllocations_Key;
}
```
### Using `InsertClientTeamAllocations`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, insertClientTeamAllocations, InsertClientTeamAllocationsVariables } from '@dataconnect/generated-server';

// The `InsertClientTeamAllocations` mutation requires an argument of type `InsertClientTeamAllocationsVariables`:
const insertClientTeamAllocationsVars: InsertClientTeamAllocationsVariables = {
  clientName: ..., 
  createdAt: ..., 
  id: ..., 
  personId: ..., 
  priority: ..., 
  roleId: ..., 
};

// Call the `insertClientTeamAllocations()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await insertClientTeamAllocations(insertClientTeamAllocationsVars);
// Variables can be defined inline as well.
const { data } = await insertClientTeamAllocations({ clientName: ..., createdAt: ..., id: ..., personId: ..., priority: ..., roleId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await insertClientTeamAllocations(dataConnect, insertClientTeamAllocationsVars);

console.log(data.clientTeamAllocations_insert);

// Or, you can use the `Promise` API.
insertClientTeamAllocations(insertClientTeamAllocationsVars).then((response) => {
  const data = response.data;
  console.log(data.clientTeamAllocations_insert);
});
```

### Using `InsertClientTeamAllocations`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, insertClientTeamAllocationsRef, InsertClientTeamAllocationsVariables } from '@dataconnect/generated-server';

// The `InsertClientTeamAllocations` mutation requires an argument of type `InsertClientTeamAllocationsVariables`:
const insertClientTeamAllocationsVars: InsertClientTeamAllocationsVariables = {
  clientName: ..., 
  createdAt: ..., 
  id: ..., 
  personId: ..., 
  priority: ..., 
  roleId: ..., 
};

// Call the `insertClientTeamAllocationsRef()` function to get a reference to the mutation.
const ref = insertClientTeamAllocationsRef(insertClientTeamAllocationsVars);
// Variables can be defined inline as well.
const ref = insertClientTeamAllocationsRef({ clientName: ..., createdAt: ..., id: ..., personId: ..., priority: ..., roleId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = insertClientTeamAllocationsRef(dataConnect, insertClientTeamAllocationsVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.clientTeamAllocations_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.clientTeamAllocations_insert);
});
```

## UpsertClientTeamAllocations
You can execute the `UpsertClientTeamAllocations` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
upsertClientTeamAllocations(vars: UpsertClientTeamAllocationsVariables): MutationPromise<UpsertClientTeamAllocationsData, UpsertClientTeamAllocationsVariables>;

interface UpsertClientTeamAllocationsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertClientTeamAllocationsVariables): MutationRef<UpsertClientTeamAllocationsData, UpsertClientTeamAllocationsVariables>;
}
export const upsertClientTeamAllocationsRef: UpsertClientTeamAllocationsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
upsertClientTeamAllocations(dc: DataConnect, vars: UpsertClientTeamAllocationsVariables): MutationPromise<UpsertClientTeamAllocationsData, UpsertClientTeamAllocationsVariables>;

interface UpsertClientTeamAllocationsRef {
  ...
  (dc: DataConnect, vars: UpsertClientTeamAllocationsVariables): MutationRef<UpsertClientTeamAllocationsData, UpsertClientTeamAllocationsVariables>;
}
export const upsertClientTeamAllocationsRef: UpsertClientTeamAllocationsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the upsertClientTeamAllocationsRef:
```typescript
const name = upsertClientTeamAllocationsRef.operationName;
console.log(name);
```

### Variables
The `UpsertClientTeamAllocations` mutation requires an argument of type `UpsertClientTeamAllocationsVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpsertClientTeamAllocationsVariables {
  clientName: string;
  createdAt: DateString;
  id: UUIDString;
  personId: UUIDString;
  priority: number;
  roleId: UUIDString;
}
```
### Return Type
Recall that executing the `UpsertClientTeamAllocations` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpsertClientTeamAllocationsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpsertClientTeamAllocationsData {
  clientTeamAllocations_upsert: ClientTeamAllocations_Key;
}
```
### Using `UpsertClientTeamAllocations`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, upsertClientTeamAllocations, UpsertClientTeamAllocationsVariables } from '@dataconnect/generated-server';

// The `UpsertClientTeamAllocations` mutation requires an argument of type `UpsertClientTeamAllocationsVariables`:
const upsertClientTeamAllocationsVars: UpsertClientTeamAllocationsVariables = {
  clientName: ..., 
  createdAt: ..., 
  id: ..., 
  personId: ..., 
  priority: ..., 
  roleId: ..., 
};

// Call the `upsertClientTeamAllocations()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await upsertClientTeamAllocations(upsertClientTeamAllocationsVars);
// Variables can be defined inline as well.
const { data } = await upsertClientTeamAllocations({ clientName: ..., createdAt: ..., id: ..., personId: ..., priority: ..., roleId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await upsertClientTeamAllocations(dataConnect, upsertClientTeamAllocationsVars);

console.log(data.clientTeamAllocations_upsert);

// Or, you can use the `Promise` API.
upsertClientTeamAllocations(upsertClientTeamAllocationsVars).then((response) => {
  const data = response.data;
  console.log(data.clientTeamAllocations_upsert);
});
```

### Using `UpsertClientTeamAllocations`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, upsertClientTeamAllocationsRef, UpsertClientTeamAllocationsVariables } from '@dataconnect/generated-server';

// The `UpsertClientTeamAllocations` mutation requires an argument of type `UpsertClientTeamAllocationsVariables`:
const upsertClientTeamAllocationsVars: UpsertClientTeamAllocationsVariables = {
  clientName: ..., 
  createdAt: ..., 
  id: ..., 
  personId: ..., 
  priority: ..., 
  roleId: ..., 
};

// Call the `upsertClientTeamAllocationsRef()` function to get a reference to the mutation.
const ref = upsertClientTeamAllocationsRef(upsertClientTeamAllocationsVars);
// Variables can be defined inline as well.
const ref = upsertClientTeamAllocationsRef({ clientName: ..., createdAt: ..., id: ..., personId: ..., priority: ..., roleId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = upsertClientTeamAllocationsRef(dataConnect, upsertClientTeamAllocationsVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.clientTeamAllocations_upsert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.clientTeamAllocations_upsert);
});
```

## InsertDailyAllocations
You can execute the `InsertDailyAllocations` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
insertDailyAllocations(vars: InsertDailyAllocationsVariables): MutationPromise<InsertDailyAllocationsData, InsertDailyAllocationsVariables>;

interface InsertDailyAllocationsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertDailyAllocationsVariables): MutationRef<InsertDailyAllocationsData, InsertDailyAllocationsVariables>;
}
export const insertDailyAllocationsRef: InsertDailyAllocationsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
insertDailyAllocations(dc: DataConnect, vars: InsertDailyAllocationsVariables): MutationPromise<InsertDailyAllocationsData, InsertDailyAllocationsVariables>;

interface InsertDailyAllocationsRef {
  ...
  (dc: DataConnect, vars: InsertDailyAllocationsVariables): MutationRef<InsertDailyAllocationsData, InsertDailyAllocationsVariables>;
}
export const insertDailyAllocationsRef: InsertDailyAllocationsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the insertDailyAllocationsRef:
```typescript
const name = insertDailyAllocationsRef.operationName;
console.log(name);
```

### Variables
The `InsertDailyAllocations` mutation requires an argument of type `InsertDailyAllocationsVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface InsertDailyAllocationsVariables {
  allocationId: UUIDString;
  createdAt: DateString;
  date: DateString;
  hours: number;
  id: UUIDString;
}
```
### Return Type
Recall that executing the `InsertDailyAllocations` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `InsertDailyAllocationsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface InsertDailyAllocationsData {
  dailyAllocations_insert: DailyAllocations_Key;
}
```
### Using `InsertDailyAllocations`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, insertDailyAllocations, InsertDailyAllocationsVariables } from '@dataconnect/generated-server';

// The `InsertDailyAllocations` mutation requires an argument of type `InsertDailyAllocationsVariables`:
const insertDailyAllocationsVars: InsertDailyAllocationsVariables = {
  allocationId: ..., 
  createdAt: ..., 
  date: ..., 
  hours: ..., 
  id: ..., 
};

// Call the `insertDailyAllocations()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await insertDailyAllocations(insertDailyAllocationsVars);
// Variables can be defined inline as well.
const { data } = await insertDailyAllocations({ allocationId: ..., createdAt: ..., date: ..., hours: ..., id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await insertDailyAllocations(dataConnect, insertDailyAllocationsVars);

console.log(data.dailyAllocations_insert);

// Or, you can use the `Promise` API.
insertDailyAllocations(insertDailyAllocationsVars).then((response) => {
  const data = response.data;
  console.log(data.dailyAllocations_insert);
});
```

### Using `InsertDailyAllocations`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, insertDailyAllocationsRef, InsertDailyAllocationsVariables } from '@dataconnect/generated-server';

// The `InsertDailyAllocations` mutation requires an argument of type `InsertDailyAllocationsVariables`:
const insertDailyAllocationsVars: InsertDailyAllocationsVariables = {
  allocationId: ..., 
  createdAt: ..., 
  date: ..., 
  hours: ..., 
  id: ..., 
};

// Call the `insertDailyAllocationsRef()` function to get a reference to the mutation.
const ref = insertDailyAllocationsRef(insertDailyAllocationsVars);
// Variables can be defined inline as well.
const ref = insertDailyAllocationsRef({ allocationId: ..., createdAt: ..., date: ..., hours: ..., id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = insertDailyAllocationsRef(dataConnect, insertDailyAllocationsVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.dailyAllocations_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.dailyAllocations_insert);
});
```

## UpsertDailyAllocations
You can execute the `UpsertDailyAllocations` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
upsertDailyAllocations(vars: UpsertDailyAllocationsVariables): MutationPromise<UpsertDailyAllocationsData, UpsertDailyAllocationsVariables>;

interface UpsertDailyAllocationsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertDailyAllocationsVariables): MutationRef<UpsertDailyAllocationsData, UpsertDailyAllocationsVariables>;
}
export const upsertDailyAllocationsRef: UpsertDailyAllocationsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
upsertDailyAllocations(dc: DataConnect, vars: UpsertDailyAllocationsVariables): MutationPromise<UpsertDailyAllocationsData, UpsertDailyAllocationsVariables>;

interface UpsertDailyAllocationsRef {
  ...
  (dc: DataConnect, vars: UpsertDailyAllocationsVariables): MutationRef<UpsertDailyAllocationsData, UpsertDailyAllocationsVariables>;
}
export const upsertDailyAllocationsRef: UpsertDailyAllocationsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the upsertDailyAllocationsRef:
```typescript
const name = upsertDailyAllocationsRef.operationName;
console.log(name);
```

### Variables
The `UpsertDailyAllocations` mutation requires an argument of type `UpsertDailyAllocationsVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpsertDailyAllocationsVariables {
  allocationId: UUIDString;
  createdAt: DateString;
  date: DateString;
  hours: number;
  id: UUIDString;
}
```
### Return Type
Recall that executing the `UpsertDailyAllocations` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpsertDailyAllocationsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpsertDailyAllocationsData {
  dailyAllocations_upsert: DailyAllocations_Key;
}
```
### Using `UpsertDailyAllocations`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, upsertDailyAllocations, UpsertDailyAllocationsVariables } from '@dataconnect/generated-server';

// The `UpsertDailyAllocations` mutation requires an argument of type `UpsertDailyAllocationsVariables`:
const upsertDailyAllocationsVars: UpsertDailyAllocationsVariables = {
  allocationId: ..., 
  createdAt: ..., 
  date: ..., 
  hours: ..., 
  id: ..., 
};

// Call the `upsertDailyAllocations()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await upsertDailyAllocations(upsertDailyAllocationsVars);
// Variables can be defined inline as well.
const { data } = await upsertDailyAllocations({ allocationId: ..., createdAt: ..., date: ..., hours: ..., id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await upsertDailyAllocations(dataConnect, upsertDailyAllocationsVars);

console.log(data.dailyAllocations_upsert);

// Or, you can use the `Promise` API.
upsertDailyAllocations(upsertDailyAllocationsVars).then((response) => {
  const data = response.data;
  console.log(data.dailyAllocations_upsert);
});
```

### Using `UpsertDailyAllocations`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, upsertDailyAllocationsRef, UpsertDailyAllocationsVariables } from '@dataconnect/generated-server';

// The `UpsertDailyAllocations` mutation requires an argument of type `UpsertDailyAllocationsVariables`:
const upsertDailyAllocationsVars: UpsertDailyAllocationsVariables = {
  allocationId: ..., 
  createdAt: ..., 
  date: ..., 
  hours: ..., 
  id: ..., 
};

// Call the `upsertDailyAllocationsRef()` function to get a reference to the mutation.
const ref = upsertDailyAllocationsRef(upsertDailyAllocationsVars);
// Variables can be defined inline as well.
const ref = upsertDailyAllocationsRef({ allocationId: ..., createdAt: ..., date: ..., hours: ..., id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = upsertDailyAllocationsRef(dataConnect, upsertDailyAllocationsVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.dailyAllocations_upsert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.dailyAllocations_upsert);
});
```

## InsertDataImports
You can execute the `InsertDataImports` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
insertDataImports(vars: InsertDataImportsVariables): MutationPromise<InsertDataImportsData, InsertDataImportsVariables>;

interface InsertDataImportsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertDataImportsVariables): MutationRef<InsertDataImportsData, InsertDataImportsVariables>;
}
export const insertDataImportsRef: InsertDataImportsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
insertDataImports(dc: DataConnect, vars: InsertDataImportsVariables): MutationPromise<InsertDataImportsData, InsertDataImportsVariables>;

interface InsertDataImportsRef {
  ...
  (dc: DataConnect, vars: InsertDataImportsVariables): MutationRef<InsertDataImportsData, InsertDataImportsVariables>;
}
export const insertDataImportsRef: InsertDataImportsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the insertDataImportsRef:
```typescript
const name = insertDataImportsRef.operationName;
console.log(name);
```

### Variables
The `InsertDataImports` mutation requires an argument of type `InsertDataImportsVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface InsertDataImportsVariables {
  dataset: string;
  id: UUIDString;
  lastImportedAt: string;
  rowCount: number;
}
```
### Return Type
Recall that executing the `InsertDataImports` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `InsertDataImportsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface InsertDataImportsData {
  dataImports_insert: DataImports_Key;
}
```
### Using `InsertDataImports`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, insertDataImports, InsertDataImportsVariables } from '@dataconnect/generated-server';

// The `InsertDataImports` mutation requires an argument of type `InsertDataImportsVariables`:
const insertDataImportsVars: InsertDataImportsVariables = {
  dataset: ..., 
  id: ..., 
  lastImportedAt: ..., 
  rowCount: ..., 
};

// Call the `insertDataImports()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await insertDataImports(insertDataImportsVars);
// Variables can be defined inline as well.
const { data } = await insertDataImports({ dataset: ..., id: ..., lastImportedAt: ..., rowCount: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await insertDataImports(dataConnect, insertDataImportsVars);

console.log(data.dataImports_insert);

// Or, you can use the `Promise` API.
insertDataImports(insertDataImportsVars).then((response) => {
  const data = response.data;
  console.log(data.dataImports_insert);
});
```

### Using `InsertDataImports`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, insertDataImportsRef, InsertDataImportsVariables } from '@dataconnect/generated-server';

// The `InsertDataImports` mutation requires an argument of type `InsertDataImportsVariables`:
const insertDataImportsVars: InsertDataImportsVariables = {
  dataset: ..., 
  id: ..., 
  lastImportedAt: ..., 
  rowCount: ..., 
};

// Call the `insertDataImportsRef()` function to get a reference to the mutation.
const ref = insertDataImportsRef(insertDataImportsVars);
// Variables can be defined inline as well.
const ref = insertDataImportsRef({ dataset: ..., id: ..., lastImportedAt: ..., rowCount: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = insertDataImportsRef(dataConnect, insertDataImportsVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.dataImports_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.dataImports_insert);
});
```

## UpsertDataImports
You can execute the `UpsertDataImports` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
upsertDataImports(vars: UpsertDataImportsVariables): MutationPromise<UpsertDataImportsData, UpsertDataImportsVariables>;

interface UpsertDataImportsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertDataImportsVariables): MutationRef<UpsertDataImportsData, UpsertDataImportsVariables>;
}
export const upsertDataImportsRef: UpsertDataImportsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
upsertDataImports(dc: DataConnect, vars: UpsertDataImportsVariables): MutationPromise<UpsertDataImportsData, UpsertDataImportsVariables>;

interface UpsertDataImportsRef {
  ...
  (dc: DataConnect, vars: UpsertDataImportsVariables): MutationRef<UpsertDataImportsData, UpsertDataImportsVariables>;
}
export const upsertDataImportsRef: UpsertDataImportsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the upsertDataImportsRef:
```typescript
const name = upsertDataImportsRef.operationName;
console.log(name);
```

### Variables
The `UpsertDataImports` mutation requires an argument of type `UpsertDataImportsVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpsertDataImportsVariables {
  dataset: string;
  id: UUIDString;
  lastImportedAt: string;
  rowCount: number;
}
```
### Return Type
Recall that executing the `UpsertDataImports` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpsertDataImportsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpsertDataImportsData {
  dataImports_upsert: DataImports_Key;
}
```
### Using `UpsertDataImports`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, upsertDataImports, UpsertDataImportsVariables } from '@dataconnect/generated-server';

// The `UpsertDataImports` mutation requires an argument of type `UpsertDataImportsVariables`:
const upsertDataImportsVars: UpsertDataImportsVariables = {
  dataset: ..., 
  id: ..., 
  lastImportedAt: ..., 
  rowCount: ..., 
};

// Call the `upsertDataImports()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await upsertDataImports(upsertDataImportsVars);
// Variables can be defined inline as well.
const { data } = await upsertDataImports({ dataset: ..., id: ..., lastImportedAt: ..., rowCount: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await upsertDataImports(dataConnect, upsertDataImportsVars);

console.log(data.dataImports_upsert);

// Or, you can use the `Promise` API.
upsertDataImports(upsertDataImportsVars).then((response) => {
  const data = response.data;
  console.log(data.dataImports_upsert);
});
```

### Using `UpsertDataImports`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, upsertDataImportsRef, UpsertDataImportsVariables } from '@dataconnect/generated-server';

// The `UpsertDataImports` mutation requires an argument of type `UpsertDataImportsVariables`:
const upsertDataImportsVars: UpsertDataImportsVariables = {
  dataset: ..., 
  id: ..., 
  lastImportedAt: ..., 
  rowCount: ..., 
};

// Call the `upsertDataImportsRef()` function to get a reference to the mutation.
const ref = upsertDataImportsRef(upsertDataImportsVars);
// Variables can be defined inline as well.
const ref = upsertDataImportsRef({ dataset: ..., id: ..., lastImportedAt: ..., rowCount: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = upsertDataImportsRef(dataConnect, upsertDataImportsVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.dataImports_upsert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.dataImports_upsert);
});
```

## InsertPeople
You can execute the `InsertPeople` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
insertPeople(vars: InsertPeopleVariables): MutationPromise<InsertPeopleData, InsertPeopleVariables>;

interface InsertPeopleRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertPeopleVariables): MutationRef<InsertPeopleData, InsertPeopleVariables>;
}
export const insertPeopleRef: InsertPeopleRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
insertPeople(dc: DataConnect, vars: InsertPeopleVariables): MutationPromise<InsertPeopleData, InsertPeopleVariables>;

interface InsertPeopleRef {
  ...
  (dc: DataConnect, vars: InsertPeopleVariables): MutationRef<InsertPeopleData, InsertPeopleVariables>;
}
export const insertPeopleRef: InsertPeopleRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the insertPeopleRef:
```typescript
const name = insertPeopleRef.operationName;
console.log(name);
```

### Variables
The `InsertPeople` mutation requires an argument of type `InsertPeopleVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface InsertPeopleVariables {
  annualSalary?: number | null;
  code?: string | null;
  createdAt: DateString;
  employmentEndDate?: DateString | null;
  employmentStartDate?: DateString | null;
  id: UUIDString;
  imcPercentage?: number | null;
  monthlySalary?: number | null;
  name: string;
  office: string;
  overallEndDate?: DateString | null;
  overallStartDate?: DateString | null;
  roleId?: UUIDString | null;
  status?: string | null;
  team?: string | null;
  type?: string | null;
  ukPercentage?: number | null;
  usPercentage?: number | null;
  isActive?: boolean | null;
}
```
### Return Type
Recall that executing the `InsertPeople` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `InsertPeopleData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface InsertPeopleData {
  people_insert: People_Key;
}
```
### Using `InsertPeople`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, insertPeople, InsertPeopleVariables } from '@dataconnect/generated-server';

// The `InsertPeople` mutation requires an argument of type `InsertPeopleVariables`:
const insertPeopleVars: InsertPeopleVariables = {
  annualSalary: ..., // optional
  code: ..., // optional
  createdAt: ..., 
  employmentEndDate: ..., // optional
  employmentStartDate: ..., // optional
  id: ..., 
  imcPercentage: ..., // optional
  monthlySalary: ..., // optional
  name: ..., 
  office: ..., 
  overallEndDate: ..., // optional
  overallStartDate: ..., // optional
  roleId: ..., // optional
  status: ..., // optional
  team: ..., // optional
  type: ..., // optional
  ukPercentage: ..., // optional
  usPercentage: ..., // optional
  isActive: ..., // optional
};

// Call the `insertPeople()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await insertPeople(insertPeopleVars);
// Variables can be defined inline as well.
const { data } = await insertPeople({ annualSalary: ..., code: ..., createdAt: ..., employmentEndDate: ..., employmentStartDate: ..., id: ..., imcPercentage: ..., monthlySalary: ..., name: ..., office: ..., overallEndDate: ..., overallStartDate: ..., roleId: ..., status: ..., team: ..., type: ..., ukPercentage: ..., usPercentage: ..., isActive: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await insertPeople(dataConnect, insertPeopleVars);

console.log(data.people_insert);

// Or, you can use the `Promise` API.
insertPeople(insertPeopleVars).then((response) => {
  const data = response.data;
  console.log(data.people_insert);
});
```

### Using `InsertPeople`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, insertPeopleRef, InsertPeopleVariables } from '@dataconnect/generated-server';

// The `InsertPeople` mutation requires an argument of type `InsertPeopleVariables`:
const insertPeopleVars: InsertPeopleVariables = {
  annualSalary: ..., // optional
  code: ..., // optional
  createdAt: ..., 
  employmentEndDate: ..., // optional
  employmentStartDate: ..., // optional
  id: ..., 
  imcPercentage: ..., // optional
  monthlySalary: ..., // optional
  name: ..., 
  office: ..., 
  overallEndDate: ..., // optional
  overallStartDate: ..., // optional
  roleId: ..., // optional
  status: ..., // optional
  team: ..., // optional
  type: ..., // optional
  ukPercentage: ..., // optional
  usPercentage: ..., // optional
  isActive: ..., // optional
};

// Call the `insertPeopleRef()` function to get a reference to the mutation.
const ref = insertPeopleRef(insertPeopleVars);
// Variables can be defined inline as well.
const ref = insertPeopleRef({ annualSalary: ..., code: ..., createdAt: ..., employmentEndDate: ..., employmentStartDate: ..., id: ..., imcPercentage: ..., monthlySalary: ..., name: ..., office: ..., overallEndDate: ..., overallStartDate: ..., roleId: ..., status: ..., team: ..., type: ..., ukPercentage: ..., usPercentage: ..., isActive: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = insertPeopleRef(dataConnect, insertPeopleVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.people_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.people_insert);
});
```

## UpsertPeople
You can execute the `UpsertPeople` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
upsertPeople(vars: UpsertPeopleVariables): MutationPromise<UpsertPeopleData, UpsertPeopleVariables>;

interface UpsertPeopleRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertPeopleVariables): MutationRef<UpsertPeopleData, UpsertPeopleVariables>;
}
export const upsertPeopleRef: UpsertPeopleRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
upsertPeople(dc: DataConnect, vars: UpsertPeopleVariables): MutationPromise<UpsertPeopleData, UpsertPeopleVariables>;

interface UpsertPeopleRef {
  ...
  (dc: DataConnect, vars: UpsertPeopleVariables): MutationRef<UpsertPeopleData, UpsertPeopleVariables>;
}
export const upsertPeopleRef: UpsertPeopleRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the upsertPeopleRef:
```typescript
const name = upsertPeopleRef.operationName;
console.log(name);
```

### Variables
The `UpsertPeople` mutation requires an argument of type `UpsertPeopleVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpsertPeopleVariables {
  annualSalary?: number | null;
  code?: string | null;
  createdAt: DateString;
  employmentEndDate?: DateString | null;
  employmentStartDate?: DateString | null;
  id: UUIDString;
  imcPercentage?: number | null;
  monthlySalary?: number | null;
  name: string;
  office: string;
  overallEndDate?: DateString | null;
  overallStartDate?: DateString | null;
  roleId?: UUIDString | null;
  status?: string | null;
  team?: string | null;
  type?: string | null;
  ukPercentage?: number | null;
  usPercentage?: number | null;
  isActive?: boolean | null;
}
```
### Return Type
Recall that executing the `UpsertPeople` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpsertPeopleData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpsertPeopleData {
  people_upsert: People_Key;
}
```
### Using `UpsertPeople`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, upsertPeople, UpsertPeopleVariables } from '@dataconnect/generated-server';

// The `UpsertPeople` mutation requires an argument of type `UpsertPeopleVariables`:
const upsertPeopleVars: UpsertPeopleVariables = {
  annualSalary: ..., // optional
  code: ..., // optional
  createdAt: ..., 
  employmentEndDate: ..., // optional
  employmentStartDate: ..., // optional
  id: ..., 
  imcPercentage: ..., // optional
  monthlySalary: ..., // optional
  name: ..., 
  office: ..., 
  overallEndDate: ..., // optional
  overallStartDate: ..., // optional
  roleId: ..., // optional
  status: ..., // optional
  team: ..., // optional
  type: ..., // optional
  ukPercentage: ..., // optional
  usPercentage: ..., // optional
  isActive: ..., // optional
};

// Call the `upsertPeople()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await upsertPeople(upsertPeopleVars);
// Variables can be defined inline as well.
const { data } = await upsertPeople({ annualSalary: ..., code: ..., createdAt: ..., employmentEndDate: ..., employmentStartDate: ..., id: ..., imcPercentage: ..., monthlySalary: ..., name: ..., office: ..., overallEndDate: ..., overallStartDate: ..., roleId: ..., status: ..., team: ..., type: ..., ukPercentage: ..., usPercentage: ..., isActive: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await upsertPeople(dataConnect, upsertPeopleVars);

console.log(data.people_upsert);

// Or, you can use the `Promise` API.
upsertPeople(upsertPeopleVars).then((response) => {
  const data = response.data;
  console.log(data.people_upsert);
});
```

### Using `UpsertPeople`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, upsertPeopleRef, UpsertPeopleVariables } from '@dataconnect/generated-server';

// The `UpsertPeople` mutation requires an argument of type `UpsertPeopleVariables`:
const upsertPeopleVars: UpsertPeopleVariables = {
  annualSalary: ..., // optional
  code: ..., // optional
  createdAt: ..., 
  employmentEndDate: ..., // optional
  employmentStartDate: ..., // optional
  id: ..., 
  imcPercentage: ..., // optional
  monthlySalary: ..., // optional
  name: ..., 
  office: ..., 
  overallEndDate: ..., // optional
  overallStartDate: ..., // optional
  roleId: ..., // optional
  status: ..., // optional
  team: ..., // optional
  type: ..., // optional
  ukPercentage: ..., // optional
  usPercentage: ..., // optional
  isActive: ..., // optional
};

// Call the `upsertPeopleRef()` function to get a reference to the mutation.
const ref = upsertPeopleRef(upsertPeopleVars);
// Variables can be defined inline as well.
const ref = upsertPeopleRef({ annualSalary: ..., code: ..., createdAt: ..., employmentEndDate: ..., employmentStartDate: ..., id: ..., imcPercentage: ..., monthlySalary: ..., name: ..., office: ..., overallEndDate: ..., overallStartDate: ..., roleId: ..., status: ..., team: ..., type: ..., ukPercentage: ..., usPercentage: ..., isActive: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = upsertPeopleRef(dataConnect, upsertPeopleVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.people_upsert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.people_upsert);
});
```

## InsertPhaseAllocations
You can execute the `InsertPhaseAllocations` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
insertPhaseAllocations(vars: InsertPhaseAllocationsVariables): MutationPromise<InsertPhaseAllocationsData, InsertPhaseAllocationsVariables>;

interface InsertPhaseAllocationsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertPhaseAllocationsVariables): MutationRef<InsertPhaseAllocationsData, InsertPhaseAllocationsVariables>;
}
export const insertPhaseAllocationsRef: InsertPhaseAllocationsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
insertPhaseAllocations(dc: DataConnect, vars: InsertPhaseAllocationsVariables): MutationPromise<InsertPhaseAllocationsData, InsertPhaseAllocationsVariables>;

interface InsertPhaseAllocationsRef {
  ...
  (dc: DataConnect, vars: InsertPhaseAllocationsVariables): MutationRef<InsertPhaseAllocationsData, InsertPhaseAllocationsVariables>;
}
export const insertPhaseAllocationsRef: InsertPhaseAllocationsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the insertPhaseAllocationsRef:
```typescript
const name = insertPhaseAllocationsRef.operationName;
console.log(name);
```

### Variables
The `InsertPhaseAllocations` mutation requires an argument of type `InsertPhaseAllocationsVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface InsertPhaseAllocationsVariables {
  allocationId?: UUIDString | null;
  createdAt: DateString;
  hours: number;
  id: UUIDString;
  phaseId: UUIDString;
  projectScopeId?: UUIDString | null;
}
```
### Return Type
Recall that executing the `InsertPhaseAllocations` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `InsertPhaseAllocationsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface InsertPhaseAllocationsData {
  phaseAllocations_insert: PhaseAllocations_Key;
}
```
### Using `InsertPhaseAllocations`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, insertPhaseAllocations, InsertPhaseAllocationsVariables } from '@dataconnect/generated-server';

// The `InsertPhaseAllocations` mutation requires an argument of type `InsertPhaseAllocationsVariables`:
const insertPhaseAllocationsVars: InsertPhaseAllocationsVariables = {
  allocationId: ..., // optional
  createdAt: ..., 
  hours: ..., 
  id: ..., 
  phaseId: ..., 
  projectScopeId: ..., // optional
};

// Call the `insertPhaseAllocations()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await insertPhaseAllocations(insertPhaseAllocationsVars);
// Variables can be defined inline as well.
const { data } = await insertPhaseAllocations({ allocationId: ..., createdAt: ..., hours: ..., id: ..., phaseId: ..., projectScopeId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await insertPhaseAllocations(dataConnect, insertPhaseAllocationsVars);

console.log(data.phaseAllocations_insert);

// Or, you can use the `Promise` API.
insertPhaseAllocations(insertPhaseAllocationsVars).then((response) => {
  const data = response.data;
  console.log(data.phaseAllocations_insert);
});
```

### Using `InsertPhaseAllocations`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, insertPhaseAllocationsRef, InsertPhaseAllocationsVariables } from '@dataconnect/generated-server';

// The `InsertPhaseAllocations` mutation requires an argument of type `InsertPhaseAllocationsVariables`:
const insertPhaseAllocationsVars: InsertPhaseAllocationsVariables = {
  allocationId: ..., // optional
  createdAt: ..., 
  hours: ..., 
  id: ..., 
  phaseId: ..., 
  projectScopeId: ..., // optional
};

// Call the `insertPhaseAllocationsRef()` function to get a reference to the mutation.
const ref = insertPhaseAllocationsRef(insertPhaseAllocationsVars);
// Variables can be defined inline as well.
const ref = insertPhaseAllocationsRef({ allocationId: ..., createdAt: ..., hours: ..., id: ..., phaseId: ..., projectScopeId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = insertPhaseAllocationsRef(dataConnect, insertPhaseAllocationsVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.phaseAllocations_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.phaseAllocations_insert);
});
```

## UpsertPhaseAllocations
You can execute the `UpsertPhaseAllocations` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
upsertPhaseAllocations(vars: UpsertPhaseAllocationsVariables): MutationPromise<UpsertPhaseAllocationsData, UpsertPhaseAllocationsVariables>;

interface UpsertPhaseAllocationsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertPhaseAllocationsVariables): MutationRef<UpsertPhaseAllocationsData, UpsertPhaseAllocationsVariables>;
}
export const upsertPhaseAllocationsRef: UpsertPhaseAllocationsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
upsertPhaseAllocations(dc: DataConnect, vars: UpsertPhaseAllocationsVariables): MutationPromise<UpsertPhaseAllocationsData, UpsertPhaseAllocationsVariables>;

interface UpsertPhaseAllocationsRef {
  ...
  (dc: DataConnect, vars: UpsertPhaseAllocationsVariables): MutationRef<UpsertPhaseAllocationsData, UpsertPhaseAllocationsVariables>;
}
export const upsertPhaseAllocationsRef: UpsertPhaseAllocationsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the upsertPhaseAllocationsRef:
```typescript
const name = upsertPhaseAllocationsRef.operationName;
console.log(name);
```

### Variables
The `UpsertPhaseAllocations` mutation requires an argument of type `UpsertPhaseAllocationsVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpsertPhaseAllocationsVariables {
  allocationId?: UUIDString | null;
  createdAt: DateString;
  hours: number;
  id: UUIDString;
  phaseId: UUIDString;
  projectScopeId?: UUIDString | null;
}
```
### Return Type
Recall that executing the `UpsertPhaseAllocations` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpsertPhaseAllocationsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpsertPhaseAllocationsData {
  phaseAllocations_upsert: PhaseAllocations_Key;
}
```
### Using `UpsertPhaseAllocations`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, upsertPhaseAllocations, UpsertPhaseAllocationsVariables } from '@dataconnect/generated-server';

// The `UpsertPhaseAllocations` mutation requires an argument of type `UpsertPhaseAllocationsVariables`:
const upsertPhaseAllocationsVars: UpsertPhaseAllocationsVariables = {
  allocationId: ..., // optional
  createdAt: ..., 
  hours: ..., 
  id: ..., 
  phaseId: ..., 
  projectScopeId: ..., // optional
};

// Call the `upsertPhaseAllocations()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await upsertPhaseAllocations(upsertPhaseAllocationsVars);
// Variables can be defined inline as well.
const { data } = await upsertPhaseAllocations({ allocationId: ..., createdAt: ..., hours: ..., id: ..., phaseId: ..., projectScopeId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await upsertPhaseAllocations(dataConnect, upsertPhaseAllocationsVars);

console.log(data.phaseAllocations_upsert);

// Or, you can use the `Promise` API.
upsertPhaseAllocations(upsertPhaseAllocationsVars).then((response) => {
  const data = response.data;
  console.log(data.phaseAllocations_upsert);
});
```

### Using `UpsertPhaseAllocations`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, upsertPhaseAllocationsRef, UpsertPhaseAllocationsVariables } from '@dataconnect/generated-server';

// The `UpsertPhaseAllocations` mutation requires an argument of type `UpsertPhaseAllocationsVariables`:
const upsertPhaseAllocationsVars: UpsertPhaseAllocationsVariables = {
  allocationId: ..., // optional
  createdAt: ..., 
  hours: ..., 
  id: ..., 
  phaseId: ..., 
  projectScopeId: ..., // optional
};

// Call the `upsertPhaseAllocationsRef()` function to get a reference to the mutation.
const ref = upsertPhaseAllocationsRef(upsertPhaseAllocationsVars);
// Variables can be defined inline as well.
const ref = upsertPhaseAllocationsRef({ allocationId: ..., createdAt: ..., hours: ..., id: ..., phaseId: ..., projectScopeId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = upsertPhaseAllocationsRef(dataConnect, upsertPhaseAllocationsVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.phaseAllocations_upsert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.phaseAllocations_upsert);
});
```

## InsertProjectMonthlyRevenue
You can execute the `InsertProjectMonthlyRevenue` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
insertProjectMonthlyRevenue(vars: InsertProjectMonthlyRevenueVariables): MutationPromise<InsertProjectMonthlyRevenueData, InsertProjectMonthlyRevenueVariables>;

interface InsertProjectMonthlyRevenueRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertProjectMonthlyRevenueVariables): MutationRef<InsertProjectMonthlyRevenueData, InsertProjectMonthlyRevenueVariables>;
}
export const insertProjectMonthlyRevenueRef: InsertProjectMonthlyRevenueRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
insertProjectMonthlyRevenue(dc: DataConnect, vars: InsertProjectMonthlyRevenueVariables): MutationPromise<InsertProjectMonthlyRevenueData, InsertProjectMonthlyRevenueVariables>;

interface InsertProjectMonthlyRevenueRef {
  ...
  (dc: DataConnect, vars: InsertProjectMonthlyRevenueVariables): MutationRef<InsertProjectMonthlyRevenueData, InsertProjectMonthlyRevenueVariables>;
}
export const insertProjectMonthlyRevenueRef: InsertProjectMonthlyRevenueRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the insertProjectMonthlyRevenueRef:
```typescript
const name = insertProjectMonthlyRevenueRef.operationName;
console.log(name);
```

### Variables
The `InsertProjectMonthlyRevenue` mutation requires an argument of type `InsertProjectMonthlyRevenueVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface InsertProjectMonthlyRevenueVariables {
  createdAt: DateString;
  id: UUIDString;
  monthDate: DateString;
  projectId: UUIDString;
  value: number;
}
```
### Return Type
Recall that executing the `InsertProjectMonthlyRevenue` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `InsertProjectMonthlyRevenueData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface InsertProjectMonthlyRevenueData {
  projectMonthlyRevenue_insert: ProjectMonthlyRevenue_Key;
}
```
### Using `InsertProjectMonthlyRevenue`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, insertProjectMonthlyRevenue, InsertProjectMonthlyRevenueVariables } from '@dataconnect/generated-server';

// The `InsertProjectMonthlyRevenue` mutation requires an argument of type `InsertProjectMonthlyRevenueVariables`:
const insertProjectMonthlyRevenueVars: InsertProjectMonthlyRevenueVariables = {
  createdAt: ..., 
  id: ..., 
  monthDate: ..., 
  projectId: ..., 
  value: ..., 
};

// Call the `insertProjectMonthlyRevenue()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await insertProjectMonthlyRevenue(insertProjectMonthlyRevenueVars);
// Variables can be defined inline as well.
const { data } = await insertProjectMonthlyRevenue({ createdAt: ..., id: ..., monthDate: ..., projectId: ..., value: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await insertProjectMonthlyRevenue(dataConnect, insertProjectMonthlyRevenueVars);

console.log(data.projectMonthlyRevenue_insert);

// Or, you can use the `Promise` API.
insertProjectMonthlyRevenue(insertProjectMonthlyRevenueVars).then((response) => {
  const data = response.data;
  console.log(data.projectMonthlyRevenue_insert);
});
```

### Using `InsertProjectMonthlyRevenue`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, insertProjectMonthlyRevenueRef, InsertProjectMonthlyRevenueVariables } from '@dataconnect/generated-server';

// The `InsertProjectMonthlyRevenue` mutation requires an argument of type `InsertProjectMonthlyRevenueVariables`:
const insertProjectMonthlyRevenueVars: InsertProjectMonthlyRevenueVariables = {
  createdAt: ..., 
  id: ..., 
  monthDate: ..., 
  projectId: ..., 
  value: ..., 
};

// Call the `insertProjectMonthlyRevenueRef()` function to get a reference to the mutation.
const ref = insertProjectMonthlyRevenueRef(insertProjectMonthlyRevenueVars);
// Variables can be defined inline as well.
const ref = insertProjectMonthlyRevenueRef({ createdAt: ..., id: ..., monthDate: ..., projectId: ..., value: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = insertProjectMonthlyRevenueRef(dataConnect, insertProjectMonthlyRevenueVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.projectMonthlyRevenue_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.projectMonthlyRevenue_insert);
});
```

## UpsertProjectMonthlyRevenue
You can execute the `UpsertProjectMonthlyRevenue` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
upsertProjectMonthlyRevenue(vars: UpsertProjectMonthlyRevenueVariables): MutationPromise<UpsertProjectMonthlyRevenueData, UpsertProjectMonthlyRevenueVariables>;

interface UpsertProjectMonthlyRevenueRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertProjectMonthlyRevenueVariables): MutationRef<UpsertProjectMonthlyRevenueData, UpsertProjectMonthlyRevenueVariables>;
}
export const upsertProjectMonthlyRevenueRef: UpsertProjectMonthlyRevenueRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
upsertProjectMonthlyRevenue(dc: DataConnect, vars: UpsertProjectMonthlyRevenueVariables): MutationPromise<UpsertProjectMonthlyRevenueData, UpsertProjectMonthlyRevenueVariables>;

interface UpsertProjectMonthlyRevenueRef {
  ...
  (dc: DataConnect, vars: UpsertProjectMonthlyRevenueVariables): MutationRef<UpsertProjectMonthlyRevenueData, UpsertProjectMonthlyRevenueVariables>;
}
export const upsertProjectMonthlyRevenueRef: UpsertProjectMonthlyRevenueRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the upsertProjectMonthlyRevenueRef:
```typescript
const name = upsertProjectMonthlyRevenueRef.operationName;
console.log(name);
```

### Variables
The `UpsertProjectMonthlyRevenue` mutation requires an argument of type `UpsertProjectMonthlyRevenueVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpsertProjectMonthlyRevenueVariables {
  createdAt: DateString;
  id: UUIDString;
  monthDate: DateString;
  projectId: UUIDString;
  value: number;
}
```
### Return Type
Recall that executing the `UpsertProjectMonthlyRevenue` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpsertProjectMonthlyRevenueData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpsertProjectMonthlyRevenueData {
  projectMonthlyRevenue_upsert: ProjectMonthlyRevenue_Key;
}
```
### Using `UpsertProjectMonthlyRevenue`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, upsertProjectMonthlyRevenue, UpsertProjectMonthlyRevenueVariables } from '@dataconnect/generated-server';

// The `UpsertProjectMonthlyRevenue` mutation requires an argument of type `UpsertProjectMonthlyRevenueVariables`:
const upsertProjectMonthlyRevenueVars: UpsertProjectMonthlyRevenueVariables = {
  createdAt: ..., 
  id: ..., 
  monthDate: ..., 
  projectId: ..., 
  value: ..., 
};

// Call the `upsertProjectMonthlyRevenue()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await upsertProjectMonthlyRevenue(upsertProjectMonthlyRevenueVars);
// Variables can be defined inline as well.
const { data } = await upsertProjectMonthlyRevenue({ createdAt: ..., id: ..., monthDate: ..., projectId: ..., value: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await upsertProjectMonthlyRevenue(dataConnect, upsertProjectMonthlyRevenueVars);

console.log(data.projectMonthlyRevenue_upsert);

// Or, you can use the `Promise` API.
upsertProjectMonthlyRevenue(upsertProjectMonthlyRevenueVars).then((response) => {
  const data = response.data;
  console.log(data.projectMonthlyRevenue_upsert);
});
```

### Using `UpsertProjectMonthlyRevenue`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, upsertProjectMonthlyRevenueRef, UpsertProjectMonthlyRevenueVariables } from '@dataconnect/generated-server';

// The `UpsertProjectMonthlyRevenue` mutation requires an argument of type `UpsertProjectMonthlyRevenueVariables`:
const upsertProjectMonthlyRevenueVars: UpsertProjectMonthlyRevenueVariables = {
  createdAt: ..., 
  id: ..., 
  monthDate: ..., 
  projectId: ..., 
  value: ..., 
};

// Call the `upsertProjectMonthlyRevenueRef()` function to get a reference to the mutation.
const ref = upsertProjectMonthlyRevenueRef(upsertProjectMonthlyRevenueVars);
// Variables can be defined inline as well.
const ref = upsertProjectMonthlyRevenueRef({ createdAt: ..., id: ..., monthDate: ..., projectId: ..., value: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = upsertProjectMonthlyRevenueRef(dataConnect, upsertProjectMonthlyRevenueVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.projectMonthlyRevenue_upsert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.projectMonthlyRevenue_upsert);
});
```

## InsertProjectPhases
You can execute the `InsertProjectPhases` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
insertProjectPhases(vars: InsertProjectPhasesVariables): MutationPromise<InsertProjectPhasesData, InsertProjectPhasesVariables>;

interface InsertProjectPhasesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertProjectPhasesVariables): MutationRef<InsertProjectPhasesData, InsertProjectPhasesVariables>;
}
export const insertProjectPhasesRef: InsertProjectPhasesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
insertProjectPhases(dc: DataConnect, vars: InsertProjectPhasesVariables): MutationPromise<InsertProjectPhasesData, InsertProjectPhasesVariables>;

interface InsertProjectPhasesRef {
  ...
  (dc: DataConnect, vars: InsertProjectPhasesVariables): MutationRef<InsertProjectPhasesData, InsertProjectPhasesVariables>;
}
export const insertProjectPhasesRef: InsertProjectPhasesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the insertProjectPhasesRef:
```typescript
const name = insertProjectPhasesRef.operationName;
console.log(name);
```

### Variables
The `InsertProjectPhases` mutation requires an argument of type `InsertProjectPhasesVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface InsertProjectPhasesVariables {
  createdAt: DateString;
  endDate?: DateString | null;
  id: UUIDString;
  phaseName: string;
  projectId: UUIDString;
  sortOrder: number;
  startDate?: DateString | null;
}
```
### Return Type
Recall that executing the `InsertProjectPhases` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `InsertProjectPhasesData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface InsertProjectPhasesData {
  projectPhases_insert: ProjectPhases_Key;
}
```
### Using `InsertProjectPhases`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, insertProjectPhases, InsertProjectPhasesVariables } from '@dataconnect/generated-server';

// The `InsertProjectPhases` mutation requires an argument of type `InsertProjectPhasesVariables`:
const insertProjectPhasesVars: InsertProjectPhasesVariables = {
  createdAt: ..., 
  endDate: ..., // optional
  id: ..., 
  phaseName: ..., 
  projectId: ..., 
  sortOrder: ..., 
  startDate: ..., // optional
};

// Call the `insertProjectPhases()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await insertProjectPhases(insertProjectPhasesVars);
// Variables can be defined inline as well.
const { data } = await insertProjectPhases({ createdAt: ..., endDate: ..., id: ..., phaseName: ..., projectId: ..., sortOrder: ..., startDate: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await insertProjectPhases(dataConnect, insertProjectPhasesVars);

console.log(data.projectPhases_insert);

// Or, you can use the `Promise` API.
insertProjectPhases(insertProjectPhasesVars).then((response) => {
  const data = response.data;
  console.log(data.projectPhases_insert);
});
```

### Using `InsertProjectPhases`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, insertProjectPhasesRef, InsertProjectPhasesVariables } from '@dataconnect/generated-server';

// The `InsertProjectPhases` mutation requires an argument of type `InsertProjectPhasesVariables`:
const insertProjectPhasesVars: InsertProjectPhasesVariables = {
  createdAt: ..., 
  endDate: ..., // optional
  id: ..., 
  phaseName: ..., 
  projectId: ..., 
  sortOrder: ..., 
  startDate: ..., // optional
};

// Call the `insertProjectPhasesRef()` function to get a reference to the mutation.
const ref = insertProjectPhasesRef(insertProjectPhasesVars);
// Variables can be defined inline as well.
const ref = insertProjectPhasesRef({ createdAt: ..., endDate: ..., id: ..., phaseName: ..., projectId: ..., sortOrder: ..., startDate: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = insertProjectPhasesRef(dataConnect, insertProjectPhasesVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.projectPhases_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.projectPhases_insert);
});
```

## UpsertProjectPhases
You can execute the `UpsertProjectPhases` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
upsertProjectPhases(vars: UpsertProjectPhasesVariables): MutationPromise<UpsertProjectPhasesData, UpsertProjectPhasesVariables>;

interface UpsertProjectPhasesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertProjectPhasesVariables): MutationRef<UpsertProjectPhasesData, UpsertProjectPhasesVariables>;
}
export const upsertProjectPhasesRef: UpsertProjectPhasesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
upsertProjectPhases(dc: DataConnect, vars: UpsertProjectPhasesVariables): MutationPromise<UpsertProjectPhasesData, UpsertProjectPhasesVariables>;

interface UpsertProjectPhasesRef {
  ...
  (dc: DataConnect, vars: UpsertProjectPhasesVariables): MutationRef<UpsertProjectPhasesData, UpsertProjectPhasesVariables>;
}
export const upsertProjectPhasesRef: UpsertProjectPhasesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the upsertProjectPhasesRef:
```typescript
const name = upsertProjectPhasesRef.operationName;
console.log(name);
```

### Variables
The `UpsertProjectPhases` mutation requires an argument of type `UpsertProjectPhasesVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpsertProjectPhasesVariables {
  createdAt: DateString;
  endDate?: DateString | null;
  id: UUIDString;
  phaseName: string;
  projectId: UUIDString;
  sortOrder: number;
  startDate?: DateString | null;
}
```
### Return Type
Recall that executing the `UpsertProjectPhases` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpsertProjectPhasesData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpsertProjectPhasesData {
  projectPhases_upsert: ProjectPhases_Key;
}
```
### Using `UpsertProjectPhases`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, upsertProjectPhases, UpsertProjectPhasesVariables } from '@dataconnect/generated-server';

// The `UpsertProjectPhases` mutation requires an argument of type `UpsertProjectPhasesVariables`:
const upsertProjectPhasesVars: UpsertProjectPhasesVariables = {
  createdAt: ..., 
  endDate: ..., // optional
  id: ..., 
  phaseName: ..., 
  projectId: ..., 
  sortOrder: ..., 
  startDate: ..., // optional
};

// Call the `upsertProjectPhases()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await upsertProjectPhases(upsertProjectPhasesVars);
// Variables can be defined inline as well.
const { data } = await upsertProjectPhases({ createdAt: ..., endDate: ..., id: ..., phaseName: ..., projectId: ..., sortOrder: ..., startDate: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await upsertProjectPhases(dataConnect, upsertProjectPhasesVars);

console.log(data.projectPhases_upsert);

// Or, you can use the `Promise` API.
upsertProjectPhases(upsertProjectPhasesVars).then((response) => {
  const data = response.data;
  console.log(data.projectPhases_upsert);
});
```

### Using `UpsertProjectPhases`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, upsertProjectPhasesRef, UpsertProjectPhasesVariables } from '@dataconnect/generated-server';

// The `UpsertProjectPhases` mutation requires an argument of type `UpsertProjectPhasesVariables`:
const upsertProjectPhasesVars: UpsertProjectPhasesVariables = {
  createdAt: ..., 
  endDate: ..., // optional
  id: ..., 
  phaseName: ..., 
  projectId: ..., 
  sortOrder: ..., 
  startDate: ..., // optional
};

// Call the `upsertProjectPhasesRef()` function to get a reference to the mutation.
const ref = upsertProjectPhasesRef(upsertProjectPhasesVars);
// Variables can be defined inline as well.
const ref = upsertProjectPhasesRef({ createdAt: ..., endDate: ..., id: ..., phaseName: ..., projectId: ..., sortOrder: ..., startDate: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = upsertProjectPhasesRef(dataConnect, upsertProjectPhasesVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.projectPhases_upsert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.projectPhases_upsert);
});
```

## InsertProjectScopes
You can execute the `InsertProjectScopes` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
insertProjectScopes(vars: InsertProjectScopesVariables): MutationPromise<InsertProjectScopesData, InsertProjectScopesVariables>;

interface InsertProjectScopesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertProjectScopesVariables): MutationRef<InsertProjectScopesData, InsertProjectScopesVariables>;
}
export const insertProjectScopesRef: InsertProjectScopesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
insertProjectScopes(dc: DataConnect, vars: InsertProjectScopesVariables): MutationPromise<InsertProjectScopesData, InsertProjectScopesVariables>;

interface InsertProjectScopesRef {
  ...
  (dc: DataConnect, vars: InsertProjectScopesVariables): MutationRef<InsertProjectScopesData, InsertProjectScopesVariables>;
}
export const insertProjectScopesRef: InsertProjectScopesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the insertProjectScopesRef:
```typescript
const name = insertProjectScopesRef.operationName;
console.log(name);
```

### Variables
The `InsertProjectScopes` mutation requires an argument of type `InsertProjectScopesVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface InsertProjectScopesVariables {
  createdAt: DateString;
  id: UUIDString;
  phasePercentages?: unknown | null;
  projectId?: UUIDString | null;
  roleId?: UUIDString | null;
  scopedHours: number;
  isActive?: boolean | null;
}
```
### Return Type
Recall that executing the `InsertProjectScopes` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `InsertProjectScopesData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface InsertProjectScopesData {
  projectScopes_insert: ProjectScopes_Key;
}
```
### Using `InsertProjectScopes`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, insertProjectScopes, InsertProjectScopesVariables } from '@dataconnect/generated-server';

// The `InsertProjectScopes` mutation requires an argument of type `InsertProjectScopesVariables`:
const insertProjectScopesVars: InsertProjectScopesVariables = {
  createdAt: ..., 
  id: ..., 
  phasePercentages: ..., // optional
  projectId: ..., // optional
  roleId: ..., // optional
  scopedHours: ..., 
  isActive: ..., // optional
};

// Call the `insertProjectScopes()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await insertProjectScopes(insertProjectScopesVars);
// Variables can be defined inline as well.
const { data } = await insertProjectScopes({ createdAt: ..., id: ..., phasePercentages: ..., projectId: ..., roleId: ..., scopedHours: ..., isActive: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await insertProjectScopes(dataConnect, insertProjectScopesVars);

console.log(data.projectScopes_insert);

// Or, you can use the `Promise` API.
insertProjectScopes(insertProjectScopesVars).then((response) => {
  const data = response.data;
  console.log(data.projectScopes_insert);
});
```

### Using `InsertProjectScopes`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, insertProjectScopesRef, InsertProjectScopesVariables } from '@dataconnect/generated-server';

// The `InsertProjectScopes` mutation requires an argument of type `InsertProjectScopesVariables`:
const insertProjectScopesVars: InsertProjectScopesVariables = {
  createdAt: ..., 
  id: ..., 
  phasePercentages: ..., // optional
  projectId: ..., // optional
  roleId: ..., // optional
  scopedHours: ..., 
  isActive: ..., // optional
};

// Call the `insertProjectScopesRef()` function to get a reference to the mutation.
const ref = insertProjectScopesRef(insertProjectScopesVars);
// Variables can be defined inline as well.
const ref = insertProjectScopesRef({ createdAt: ..., id: ..., phasePercentages: ..., projectId: ..., roleId: ..., scopedHours: ..., isActive: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = insertProjectScopesRef(dataConnect, insertProjectScopesVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.projectScopes_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.projectScopes_insert);
});
```

## UpsertProjectScopes
You can execute the `UpsertProjectScopes` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
upsertProjectScopes(vars: UpsertProjectScopesVariables): MutationPromise<UpsertProjectScopesData, UpsertProjectScopesVariables>;

interface UpsertProjectScopesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertProjectScopesVariables): MutationRef<UpsertProjectScopesData, UpsertProjectScopesVariables>;
}
export const upsertProjectScopesRef: UpsertProjectScopesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
upsertProjectScopes(dc: DataConnect, vars: UpsertProjectScopesVariables): MutationPromise<UpsertProjectScopesData, UpsertProjectScopesVariables>;

interface UpsertProjectScopesRef {
  ...
  (dc: DataConnect, vars: UpsertProjectScopesVariables): MutationRef<UpsertProjectScopesData, UpsertProjectScopesVariables>;
}
export const upsertProjectScopesRef: UpsertProjectScopesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the upsertProjectScopesRef:
```typescript
const name = upsertProjectScopesRef.operationName;
console.log(name);
```

### Variables
The `UpsertProjectScopes` mutation requires an argument of type `UpsertProjectScopesVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpsertProjectScopesVariables {
  createdAt: DateString;
  id: UUIDString;
  phasePercentages?: unknown | null;
  projectId?: UUIDString | null;
  roleId?: UUIDString | null;
  scopedHours: number;
  isActive?: boolean | null;
}
```
### Return Type
Recall that executing the `UpsertProjectScopes` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpsertProjectScopesData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpsertProjectScopesData {
  projectScopes_upsert: ProjectScopes_Key;
}
```
### Using `UpsertProjectScopes`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, upsertProjectScopes, UpsertProjectScopesVariables } from '@dataconnect/generated-server';

// The `UpsertProjectScopes` mutation requires an argument of type `UpsertProjectScopesVariables`:
const upsertProjectScopesVars: UpsertProjectScopesVariables = {
  createdAt: ..., 
  id: ..., 
  phasePercentages: ..., // optional
  projectId: ..., // optional
  roleId: ..., // optional
  scopedHours: ..., 
  isActive: ..., // optional
};

// Call the `upsertProjectScopes()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await upsertProjectScopes(upsertProjectScopesVars);
// Variables can be defined inline as well.
const { data } = await upsertProjectScopes({ createdAt: ..., id: ..., phasePercentages: ..., projectId: ..., roleId: ..., scopedHours: ..., isActive: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await upsertProjectScopes(dataConnect, upsertProjectScopesVars);

console.log(data.projectScopes_upsert);

// Or, you can use the `Promise` API.
upsertProjectScopes(upsertProjectScopesVars).then((response) => {
  const data = response.data;
  console.log(data.projectScopes_upsert);
});
```

### Using `UpsertProjectScopes`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, upsertProjectScopesRef, UpsertProjectScopesVariables } from '@dataconnect/generated-server';

// The `UpsertProjectScopes` mutation requires an argument of type `UpsertProjectScopesVariables`:
const upsertProjectScopesVars: UpsertProjectScopesVariables = {
  createdAt: ..., 
  id: ..., 
  phasePercentages: ..., // optional
  projectId: ..., // optional
  roleId: ..., // optional
  scopedHours: ..., 
  isActive: ..., // optional
};

// Call the `upsertProjectScopesRef()` function to get a reference to the mutation.
const ref = upsertProjectScopesRef(upsertProjectScopesVars);
// Variables can be defined inline as well.
const ref = upsertProjectScopesRef({ createdAt: ..., id: ..., phasePercentages: ..., projectId: ..., roleId: ..., scopedHours: ..., isActive: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = upsertProjectScopesRef(dataConnect, upsertProjectScopesVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.projectScopes_upsert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.projectScopes_upsert);
});
```

## InsertProjects
You can execute the `InsertProjects` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
insertProjects(vars: InsertProjectsVariables): MutationPromise<InsertProjectsData, InsertProjectsVariables>;

interface InsertProjectsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertProjectsVariables): MutationRef<InsertProjectsData, InsertProjectsVariables>;
}
export const insertProjectsRef: InsertProjectsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
insertProjects(dc: DataConnect, vars: InsertProjectsVariables): MutationPromise<InsertProjectsData, InsertProjectsVariables>;

interface InsertProjectsRef {
  ...
  (dc: DataConnect, vars: InsertProjectsVariables): MutationRef<InsertProjectsData, InsertProjectsVariables>;
}
export const insertProjectsRef: InsertProjectsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the insertProjectsRef:
```typescript
const name = insertProjectsRef.operationName;
console.log(name);
```

### Variables
The `InsertProjects` mutation requires an argument of type `InsertProjectsVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface InsertProjectsVariables {
  actualCost?: number | null;
  bdbHours?: number | null;
  budgetCost?: number | null;
  closeDate?: DateString | null;
  contractedInflCost?: number | null;
  createdAt: DateString;
  createdDate?: DateString | null;
  dealValueDerisked?: number | null;
  durationWeeks?: number | null;
  durationWeeksRounded?: number | null;
  endDate: DateString;
  endWeek?: string | null;
  extraData?: unknown | null;
  feeCalcCurrency?: string | null;
  fxLockDate?: DateString | null;
  fxRateGbp?: number | null;
  fxRateUsd?: number | null;
  gpCheck?: string | null;
  gpFullValue?: number | null;
  gpFullValuePerDay?: number | null;
  gpMarginPct?: number | null;
  grossBudget?: number | null;
  hardCosts?: number | null;
  hub?: string | null;
  id: UUIDString;
  industry?: string | null;
  inflProductionCosts?: number | null;
  lastFeeCalcUrl?: string | null;
  leadSource?: string | null;
  mediaCost?: number | null;
  newRepeat?: string | null;
  office?: string | null;
  opportunityNumber?: string | null;
  opportunityOwner?: string | null;
  opportunityRecordType?: string | null;
  originalLeadSource?: string | null;
  paidMediaFees?: number | null;
  parentAccount?: string | null;
  phase1End?: string | null;
  phase1Name?: string | null;
  phase1Start?: string | null;
  phase2End?: string | null;
  phase2Name?: string | null;
  phase2Start?: string | null;
  phase3End?: string | null;
  phase3Name?: string | null;
  phase3Start?: string | null;
  phase4End?: string | null;
  phase4Name?: string | null;
  phase4Start?: string | null;
  price?: number | null;
  probability?: number | null;
  rateCardDiscount: number;
  rateCardId?: UUIDString | null;
  revenue?: number | null;
  sfAccount?: string | null;
  stage?: string | null;
  startDate: DateString;
  startWeek?: string | null;
  title: string;
  totalFees?: number | null;
  ultimateParent?: string | null;
  updatedAt: DateString;
  valuePerWeekPhase1?: number | null;
  valuePerWeekPhase2?: number | null;
  valuePerWeekPhase3?: number | null;
  valuePerWeekPhase4?: number | null;
  isActive?: boolean | null;
}
```
### Return Type
Recall that executing the `InsertProjects` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `InsertProjectsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface InsertProjectsData {
  projects_insert: Projects_Key;
}
```
### Using `InsertProjects`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, insertProjects, InsertProjectsVariables } from '@dataconnect/generated-server';

// The `InsertProjects` mutation requires an argument of type `InsertProjectsVariables`:
const insertProjectsVars: InsertProjectsVariables = {
  actualCost: ..., // optional
  bdbHours: ..., // optional
  budgetCost: ..., // optional
  closeDate: ..., // optional
  contractedInflCost: ..., // optional
  createdAt: ..., 
  createdDate: ..., // optional
  dealValueDerisked: ..., // optional
  durationWeeks: ..., // optional
  durationWeeksRounded: ..., // optional
  endDate: ..., 
  endWeek: ..., // optional
  extraData: ..., // optional
  feeCalcCurrency: ..., // optional
  fxLockDate: ..., // optional
  fxRateGbp: ..., // optional
  fxRateUsd: ..., // optional
  gpCheck: ..., // optional
  gpFullValue: ..., // optional
  gpFullValuePerDay: ..., // optional
  gpMarginPct: ..., // optional
  grossBudget: ..., // optional
  hardCosts: ..., // optional
  hub: ..., // optional
  id: ..., 
  industry: ..., // optional
  inflProductionCosts: ..., // optional
  lastFeeCalcUrl: ..., // optional
  leadSource: ..., // optional
  mediaCost: ..., // optional
  newRepeat: ..., // optional
  office: ..., // optional
  opportunityNumber: ..., // optional
  opportunityOwner: ..., // optional
  opportunityRecordType: ..., // optional
  originalLeadSource: ..., // optional
  paidMediaFees: ..., // optional
  parentAccount: ..., // optional
  phase1End: ..., // optional
  phase1Name: ..., // optional
  phase1Start: ..., // optional
  phase2End: ..., // optional
  phase2Name: ..., // optional
  phase2Start: ..., // optional
  phase3End: ..., // optional
  phase3Name: ..., // optional
  phase3Start: ..., // optional
  phase4End: ..., // optional
  phase4Name: ..., // optional
  phase4Start: ..., // optional
  price: ..., // optional
  probability: ..., // optional
  rateCardDiscount: ..., 
  rateCardId: ..., // optional
  revenue: ..., // optional
  sfAccount: ..., // optional
  stage: ..., // optional
  startDate: ..., 
  startWeek: ..., // optional
  title: ..., 
  totalFees: ..., // optional
  ultimateParent: ..., // optional
  updatedAt: ..., 
  valuePerWeekPhase1: ..., // optional
  valuePerWeekPhase2: ..., // optional
  valuePerWeekPhase3: ..., // optional
  valuePerWeekPhase4: ..., // optional
  isActive: ..., // optional
};

// Call the `insertProjects()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await insertProjects(insertProjectsVars);
// Variables can be defined inline as well.
const { data } = await insertProjects({ actualCost: ..., bdbHours: ..., budgetCost: ..., closeDate: ..., contractedInflCost: ..., createdAt: ..., createdDate: ..., dealValueDerisked: ..., durationWeeks: ..., durationWeeksRounded: ..., endDate: ..., endWeek: ..., extraData: ..., feeCalcCurrency: ..., fxLockDate: ..., fxRateGbp: ..., fxRateUsd: ..., gpCheck: ..., gpFullValue: ..., gpFullValuePerDay: ..., gpMarginPct: ..., grossBudget: ..., hardCosts: ..., hub: ..., id: ..., industry: ..., inflProductionCosts: ..., lastFeeCalcUrl: ..., leadSource: ..., mediaCost: ..., newRepeat: ..., office: ..., opportunityNumber: ..., opportunityOwner: ..., opportunityRecordType: ..., originalLeadSource: ..., paidMediaFees: ..., parentAccount: ..., phase1End: ..., phase1Name: ..., phase1Start: ..., phase2End: ..., phase2Name: ..., phase2Start: ..., phase3End: ..., phase3Name: ..., phase3Start: ..., phase4End: ..., phase4Name: ..., phase4Start: ..., price: ..., probability: ..., rateCardDiscount: ..., rateCardId: ..., revenue: ..., sfAccount: ..., stage: ..., startDate: ..., startWeek: ..., title: ..., totalFees: ..., ultimateParent: ..., updatedAt: ..., valuePerWeekPhase1: ..., valuePerWeekPhase2: ..., valuePerWeekPhase3: ..., valuePerWeekPhase4: ..., isActive: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await insertProjects(dataConnect, insertProjectsVars);

console.log(data.projects_insert);

// Or, you can use the `Promise` API.
insertProjects(insertProjectsVars).then((response) => {
  const data = response.data;
  console.log(data.projects_insert);
});
```

### Using `InsertProjects`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, insertProjectsRef, InsertProjectsVariables } from '@dataconnect/generated-server';

// The `InsertProjects` mutation requires an argument of type `InsertProjectsVariables`:
const insertProjectsVars: InsertProjectsVariables = {
  actualCost: ..., // optional
  bdbHours: ..., // optional
  budgetCost: ..., // optional
  closeDate: ..., // optional
  contractedInflCost: ..., // optional
  createdAt: ..., 
  createdDate: ..., // optional
  dealValueDerisked: ..., // optional
  durationWeeks: ..., // optional
  durationWeeksRounded: ..., // optional
  endDate: ..., 
  endWeek: ..., // optional
  extraData: ..., // optional
  feeCalcCurrency: ..., // optional
  fxLockDate: ..., // optional
  fxRateGbp: ..., // optional
  fxRateUsd: ..., // optional
  gpCheck: ..., // optional
  gpFullValue: ..., // optional
  gpFullValuePerDay: ..., // optional
  gpMarginPct: ..., // optional
  grossBudget: ..., // optional
  hardCosts: ..., // optional
  hub: ..., // optional
  id: ..., 
  industry: ..., // optional
  inflProductionCosts: ..., // optional
  lastFeeCalcUrl: ..., // optional
  leadSource: ..., // optional
  mediaCost: ..., // optional
  newRepeat: ..., // optional
  office: ..., // optional
  opportunityNumber: ..., // optional
  opportunityOwner: ..., // optional
  opportunityRecordType: ..., // optional
  originalLeadSource: ..., // optional
  paidMediaFees: ..., // optional
  parentAccount: ..., // optional
  phase1End: ..., // optional
  phase1Name: ..., // optional
  phase1Start: ..., // optional
  phase2End: ..., // optional
  phase2Name: ..., // optional
  phase2Start: ..., // optional
  phase3End: ..., // optional
  phase3Name: ..., // optional
  phase3Start: ..., // optional
  phase4End: ..., // optional
  phase4Name: ..., // optional
  phase4Start: ..., // optional
  price: ..., // optional
  probability: ..., // optional
  rateCardDiscount: ..., 
  rateCardId: ..., // optional
  revenue: ..., // optional
  sfAccount: ..., // optional
  stage: ..., // optional
  startDate: ..., 
  startWeek: ..., // optional
  title: ..., 
  totalFees: ..., // optional
  ultimateParent: ..., // optional
  updatedAt: ..., 
  valuePerWeekPhase1: ..., // optional
  valuePerWeekPhase2: ..., // optional
  valuePerWeekPhase3: ..., // optional
  valuePerWeekPhase4: ..., // optional
  isActive: ..., // optional
};

// Call the `insertProjectsRef()` function to get a reference to the mutation.
const ref = insertProjectsRef(insertProjectsVars);
// Variables can be defined inline as well.
const ref = insertProjectsRef({ actualCost: ..., bdbHours: ..., budgetCost: ..., closeDate: ..., contractedInflCost: ..., createdAt: ..., createdDate: ..., dealValueDerisked: ..., durationWeeks: ..., durationWeeksRounded: ..., endDate: ..., endWeek: ..., extraData: ..., feeCalcCurrency: ..., fxLockDate: ..., fxRateGbp: ..., fxRateUsd: ..., gpCheck: ..., gpFullValue: ..., gpFullValuePerDay: ..., gpMarginPct: ..., grossBudget: ..., hardCosts: ..., hub: ..., id: ..., industry: ..., inflProductionCosts: ..., lastFeeCalcUrl: ..., leadSource: ..., mediaCost: ..., newRepeat: ..., office: ..., opportunityNumber: ..., opportunityOwner: ..., opportunityRecordType: ..., originalLeadSource: ..., paidMediaFees: ..., parentAccount: ..., phase1End: ..., phase1Name: ..., phase1Start: ..., phase2End: ..., phase2Name: ..., phase2Start: ..., phase3End: ..., phase3Name: ..., phase3Start: ..., phase4End: ..., phase4Name: ..., phase4Start: ..., price: ..., probability: ..., rateCardDiscount: ..., rateCardId: ..., revenue: ..., sfAccount: ..., stage: ..., startDate: ..., startWeek: ..., title: ..., totalFees: ..., ultimateParent: ..., updatedAt: ..., valuePerWeekPhase1: ..., valuePerWeekPhase2: ..., valuePerWeekPhase3: ..., valuePerWeekPhase4: ..., isActive: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = insertProjectsRef(dataConnect, insertProjectsVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.projects_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.projects_insert);
});
```

## UpsertProjects
You can execute the `UpsertProjects` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
upsertProjects(vars: UpsertProjectsVariables): MutationPromise<UpsertProjectsData, UpsertProjectsVariables>;

interface UpsertProjectsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertProjectsVariables): MutationRef<UpsertProjectsData, UpsertProjectsVariables>;
}
export const upsertProjectsRef: UpsertProjectsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
upsertProjects(dc: DataConnect, vars: UpsertProjectsVariables): MutationPromise<UpsertProjectsData, UpsertProjectsVariables>;

interface UpsertProjectsRef {
  ...
  (dc: DataConnect, vars: UpsertProjectsVariables): MutationRef<UpsertProjectsData, UpsertProjectsVariables>;
}
export const upsertProjectsRef: UpsertProjectsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the upsertProjectsRef:
```typescript
const name = upsertProjectsRef.operationName;
console.log(name);
```

### Variables
The `UpsertProjects` mutation requires an argument of type `UpsertProjectsVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpsertProjectsVariables {
  actualCost?: number | null;
  bdbHours?: number | null;
  budgetCost?: number | null;
  closeDate?: DateString | null;
  contractedInflCost?: number | null;
  createdAt: DateString;
  createdDate?: DateString | null;
  dealValueDerisked?: number | null;
  durationWeeks?: number | null;
  durationWeeksRounded?: number | null;
  endDate: DateString;
  endWeek?: string | null;
  extraData?: unknown | null;
  feeCalcCurrency?: string | null;
  fxLockDate?: DateString | null;
  fxRateGbp?: number | null;
  fxRateUsd?: number | null;
  gpCheck?: string | null;
  gpFullValue?: number | null;
  gpFullValuePerDay?: number | null;
  gpMarginPct?: number | null;
  grossBudget?: number | null;
  hardCosts?: number | null;
  hub?: string | null;
  id: UUIDString;
  industry?: string | null;
  inflProductionCosts?: number | null;
  lastFeeCalcUrl?: string | null;
  leadSource?: string | null;
  mediaCost?: number | null;
  newRepeat?: string | null;
  office?: string | null;
  opportunityNumber?: string | null;
  opportunityOwner?: string | null;
  opportunityRecordType?: string | null;
  originalLeadSource?: string | null;
  paidMediaFees?: number | null;
  parentAccount?: string | null;
  phase1End?: string | null;
  phase1Name?: string | null;
  phase1Start?: string | null;
  phase2End?: string | null;
  phase2Name?: string | null;
  phase2Start?: string | null;
  phase3End?: string | null;
  phase3Name?: string | null;
  phase3Start?: string | null;
  phase4End?: string | null;
  phase4Name?: string | null;
  phase4Start?: string | null;
  price?: number | null;
  probability?: number | null;
  rateCardDiscount: number;
  rateCardId?: UUIDString | null;
  revenue?: number | null;
  sfAccount?: string | null;
  stage?: string | null;
  startDate: DateString;
  startWeek?: string | null;
  title: string;
  totalFees?: number | null;
  ultimateParent?: string | null;
  updatedAt: DateString;
  valuePerWeekPhase1?: number | null;
  valuePerWeekPhase2?: number | null;
  valuePerWeekPhase3?: number | null;
  valuePerWeekPhase4?: number | null;
  isActive?: boolean | null;
}
```
### Return Type
Recall that executing the `UpsertProjects` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpsertProjectsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpsertProjectsData {
  projects_upsert: Projects_Key;
}
```
### Using `UpsertProjects`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, upsertProjects, UpsertProjectsVariables } from '@dataconnect/generated-server';

// The `UpsertProjects` mutation requires an argument of type `UpsertProjectsVariables`:
const upsertProjectsVars: UpsertProjectsVariables = {
  actualCost: ..., // optional
  bdbHours: ..., // optional
  budgetCost: ..., // optional
  closeDate: ..., // optional
  contractedInflCost: ..., // optional
  createdAt: ..., 
  createdDate: ..., // optional
  dealValueDerisked: ..., // optional
  durationWeeks: ..., // optional
  durationWeeksRounded: ..., // optional
  endDate: ..., 
  endWeek: ..., // optional
  extraData: ..., // optional
  feeCalcCurrency: ..., // optional
  fxLockDate: ..., // optional
  fxRateGbp: ..., // optional
  fxRateUsd: ..., // optional
  gpCheck: ..., // optional
  gpFullValue: ..., // optional
  gpFullValuePerDay: ..., // optional
  gpMarginPct: ..., // optional
  grossBudget: ..., // optional
  hardCosts: ..., // optional
  hub: ..., // optional
  id: ..., 
  industry: ..., // optional
  inflProductionCosts: ..., // optional
  lastFeeCalcUrl: ..., // optional
  leadSource: ..., // optional
  mediaCost: ..., // optional
  newRepeat: ..., // optional
  office: ..., // optional
  opportunityNumber: ..., // optional
  opportunityOwner: ..., // optional
  opportunityRecordType: ..., // optional
  originalLeadSource: ..., // optional
  paidMediaFees: ..., // optional
  parentAccount: ..., // optional
  phase1End: ..., // optional
  phase1Name: ..., // optional
  phase1Start: ..., // optional
  phase2End: ..., // optional
  phase2Name: ..., // optional
  phase2Start: ..., // optional
  phase3End: ..., // optional
  phase3Name: ..., // optional
  phase3Start: ..., // optional
  phase4End: ..., // optional
  phase4Name: ..., // optional
  phase4Start: ..., // optional
  price: ..., // optional
  probability: ..., // optional
  rateCardDiscount: ..., 
  rateCardId: ..., // optional
  revenue: ..., // optional
  sfAccount: ..., // optional
  stage: ..., // optional
  startDate: ..., 
  startWeek: ..., // optional
  title: ..., 
  totalFees: ..., // optional
  ultimateParent: ..., // optional
  updatedAt: ..., 
  valuePerWeekPhase1: ..., // optional
  valuePerWeekPhase2: ..., // optional
  valuePerWeekPhase3: ..., // optional
  valuePerWeekPhase4: ..., // optional
  isActive: ..., // optional
};

// Call the `upsertProjects()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await upsertProjects(upsertProjectsVars);
// Variables can be defined inline as well.
const { data } = await upsertProjects({ actualCost: ..., bdbHours: ..., budgetCost: ..., closeDate: ..., contractedInflCost: ..., createdAt: ..., createdDate: ..., dealValueDerisked: ..., durationWeeks: ..., durationWeeksRounded: ..., endDate: ..., endWeek: ..., extraData: ..., feeCalcCurrency: ..., fxLockDate: ..., fxRateGbp: ..., fxRateUsd: ..., gpCheck: ..., gpFullValue: ..., gpFullValuePerDay: ..., gpMarginPct: ..., grossBudget: ..., hardCosts: ..., hub: ..., id: ..., industry: ..., inflProductionCosts: ..., lastFeeCalcUrl: ..., leadSource: ..., mediaCost: ..., newRepeat: ..., office: ..., opportunityNumber: ..., opportunityOwner: ..., opportunityRecordType: ..., originalLeadSource: ..., paidMediaFees: ..., parentAccount: ..., phase1End: ..., phase1Name: ..., phase1Start: ..., phase2End: ..., phase2Name: ..., phase2Start: ..., phase3End: ..., phase3Name: ..., phase3Start: ..., phase4End: ..., phase4Name: ..., phase4Start: ..., price: ..., probability: ..., rateCardDiscount: ..., rateCardId: ..., revenue: ..., sfAccount: ..., stage: ..., startDate: ..., startWeek: ..., title: ..., totalFees: ..., ultimateParent: ..., updatedAt: ..., valuePerWeekPhase1: ..., valuePerWeekPhase2: ..., valuePerWeekPhase3: ..., valuePerWeekPhase4: ..., isActive: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await upsertProjects(dataConnect, upsertProjectsVars);

console.log(data.projects_upsert);

// Or, you can use the `Promise` API.
upsertProjects(upsertProjectsVars).then((response) => {
  const data = response.data;
  console.log(data.projects_upsert);
});
```

### Using `UpsertProjects`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, upsertProjectsRef, UpsertProjectsVariables } from '@dataconnect/generated-server';

// The `UpsertProjects` mutation requires an argument of type `UpsertProjectsVariables`:
const upsertProjectsVars: UpsertProjectsVariables = {
  actualCost: ..., // optional
  bdbHours: ..., // optional
  budgetCost: ..., // optional
  closeDate: ..., // optional
  contractedInflCost: ..., // optional
  createdAt: ..., 
  createdDate: ..., // optional
  dealValueDerisked: ..., // optional
  durationWeeks: ..., // optional
  durationWeeksRounded: ..., // optional
  endDate: ..., 
  endWeek: ..., // optional
  extraData: ..., // optional
  feeCalcCurrency: ..., // optional
  fxLockDate: ..., // optional
  fxRateGbp: ..., // optional
  fxRateUsd: ..., // optional
  gpCheck: ..., // optional
  gpFullValue: ..., // optional
  gpFullValuePerDay: ..., // optional
  gpMarginPct: ..., // optional
  grossBudget: ..., // optional
  hardCosts: ..., // optional
  hub: ..., // optional
  id: ..., 
  industry: ..., // optional
  inflProductionCosts: ..., // optional
  lastFeeCalcUrl: ..., // optional
  leadSource: ..., // optional
  mediaCost: ..., // optional
  newRepeat: ..., // optional
  office: ..., // optional
  opportunityNumber: ..., // optional
  opportunityOwner: ..., // optional
  opportunityRecordType: ..., // optional
  originalLeadSource: ..., // optional
  paidMediaFees: ..., // optional
  parentAccount: ..., // optional
  phase1End: ..., // optional
  phase1Name: ..., // optional
  phase1Start: ..., // optional
  phase2End: ..., // optional
  phase2Name: ..., // optional
  phase2Start: ..., // optional
  phase3End: ..., // optional
  phase3Name: ..., // optional
  phase3Start: ..., // optional
  phase4End: ..., // optional
  phase4Name: ..., // optional
  phase4Start: ..., // optional
  price: ..., // optional
  probability: ..., // optional
  rateCardDiscount: ..., 
  rateCardId: ..., // optional
  revenue: ..., // optional
  sfAccount: ..., // optional
  stage: ..., // optional
  startDate: ..., 
  startWeek: ..., // optional
  title: ..., 
  totalFees: ..., // optional
  ultimateParent: ..., // optional
  updatedAt: ..., 
  valuePerWeekPhase1: ..., // optional
  valuePerWeekPhase2: ..., // optional
  valuePerWeekPhase3: ..., // optional
  valuePerWeekPhase4: ..., // optional
  isActive: ..., // optional
};

// Call the `upsertProjectsRef()` function to get a reference to the mutation.
const ref = upsertProjectsRef(upsertProjectsVars);
// Variables can be defined inline as well.
const ref = upsertProjectsRef({ actualCost: ..., bdbHours: ..., budgetCost: ..., closeDate: ..., contractedInflCost: ..., createdAt: ..., createdDate: ..., dealValueDerisked: ..., durationWeeks: ..., durationWeeksRounded: ..., endDate: ..., endWeek: ..., extraData: ..., feeCalcCurrency: ..., fxLockDate: ..., fxRateGbp: ..., fxRateUsd: ..., gpCheck: ..., gpFullValue: ..., gpFullValuePerDay: ..., gpMarginPct: ..., grossBudget: ..., hardCosts: ..., hub: ..., id: ..., industry: ..., inflProductionCosts: ..., lastFeeCalcUrl: ..., leadSource: ..., mediaCost: ..., newRepeat: ..., office: ..., opportunityNumber: ..., opportunityOwner: ..., opportunityRecordType: ..., originalLeadSource: ..., paidMediaFees: ..., parentAccount: ..., phase1End: ..., phase1Name: ..., phase1Start: ..., phase2End: ..., phase2Name: ..., phase2Start: ..., phase3End: ..., phase3Name: ..., phase3Start: ..., phase4End: ..., phase4Name: ..., phase4Start: ..., price: ..., probability: ..., rateCardDiscount: ..., rateCardId: ..., revenue: ..., sfAccount: ..., stage: ..., startDate: ..., startWeek: ..., title: ..., totalFees: ..., ultimateParent: ..., updatedAt: ..., valuePerWeekPhase1: ..., valuePerWeekPhase2: ..., valuePerWeekPhase3: ..., valuePerWeekPhase4: ..., isActive: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = upsertProjectsRef(dataConnect, upsertProjectsVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.projects_upsert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.projects_upsert);
});
```

## InsertRateCards
You can execute the `InsertRateCards` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
insertRateCards(vars: InsertRateCardsVariables): MutationPromise<InsertRateCardsData, InsertRateCardsVariables>;

interface InsertRateCardsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertRateCardsVariables): MutationRef<InsertRateCardsData, InsertRateCardsVariables>;
}
export const insertRateCardsRef: InsertRateCardsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
insertRateCards(dc: DataConnect, vars: InsertRateCardsVariables): MutationPromise<InsertRateCardsData, InsertRateCardsVariables>;

interface InsertRateCardsRef {
  ...
  (dc: DataConnect, vars: InsertRateCardsVariables): MutationRef<InsertRateCardsData, InsertRateCardsVariables>;
}
export const insertRateCardsRef: InsertRateCardsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the insertRateCardsRef:
```typescript
const name = insertRateCardsRef.operationName;
console.log(name);
```

### Variables
The `InsertRateCards` mutation requires an argument of type `InsertRateCardsVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface InsertRateCardsVariables {
  createdAt: DateString;
  currency: string;
  hourlyRate: number;
  id: UUIDString;
  name: string;
  roleId?: UUIDString | null;
  isActive?: boolean | null;
}
```
### Return Type
Recall that executing the `InsertRateCards` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `InsertRateCardsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface InsertRateCardsData {
  rateCards_insert: RateCards_Key;
}
```
### Using `InsertRateCards`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, insertRateCards, InsertRateCardsVariables } from '@dataconnect/generated-server';

// The `InsertRateCards` mutation requires an argument of type `InsertRateCardsVariables`:
const insertRateCardsVars: InsertRateCardsVariables = {
  createdAt: ..., 
  currency: ..., 
  hourlyRate: ..., 
  id: ..., 
  name: ..., 
  roleId: ..., // optional
  isActive: ..., // optional
};

// Call the `insertRateCards()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await insertRateCards(insertRateCardsVars);
// Variables can be defined inline as well.
const { data } = await insertRateCards({ createdAt: ..., currency: ..., hourlyRate: ..., id: ..., name: ..., roleId: ..., isActive: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await insertRateCards(dataConnect, insertRateCardsVars);

console.log(data.rateCards_insert);

// Or, you can use the `Promise` API.
insertRateCards(insertRateCardsVars).then((response) => {
  const data = response.data;
  console.log(data.rateCards_insert);
});
```

### Using `InsertRateCards`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, insertRateCardsRef, InsertRateCardsVariables } from '@dataconnect/generated-server';

// The `InsertRateCards` mutation requires an argument of type `InsertRateCardsVariables`:
const insertRateCardsVars: InsertRateCardsVariables = {
  createdAt: ..., 
  currency: ..., 
  hourlyRate: ..., 
  id: ..., 
  name: ..., 
  roleId: ..., // optional
  isActive: ..., // optional
};

// Call the `insertRateCardsRef()` function to get a reference to the mutation.
const ref = insertRateCardsRef(insertRateCardsVars);
// Variables can be defined inline as well.
const ref = insertRateCardsRef({ createdAt: ..., currency: ..., hourlyRate: ..., id: ..., name: ..., roleId: ..., isActive: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = insertRateCardsRef(dataConnect, insertRateCardsVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.rateCards_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.rateCards_insert);
});
```

## UpsertRateCards
You can execute the `UpsertRateCards` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
upsertRateCards(vars: UpsertRateCardsVariables): MutationPromise<UpsertRateCardsData, UpsertRateCardsVariables>;

interface UpsertRateCardsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertRateCardsVariables): MutationRef<UpsertRateCardsData, UpsertRateCardsVariables>;
}
export const upsertRateCardsRef: UpsertRateCardsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
upsertRateCards(dc: DataConnect, vars: UpsertRateCardsVariables): MutationPromise<UpsertRateCardsData, UpsertRateCardsVariables>;

interface UpsertRateCardsRef {
  ...
  (dc: DataConnect, vars: UpsertRateCardsVariables): MutationRef<UpsertRateCardsData, UpsertRateCardsVariables>;
}
export const upsertRateCardsRef: UpsertRateCardsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the upsertRateCardsRef:
```typescript
const name = upsertRateCardsRef.operationName;
console.log(name);
```

### Variables
The `UpsertRateCards` mutation requires an argument of type `UpsertRateCardsVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpsertRateCardsVariables {
  createdAt: DateString;
  currency: string;
  hourlyRate: number;
  id: UUIDString;
  name: string;
  roleId?: UUIDString | null;
  isActive?: boolean | null;
}
```
### Return Type
Recall that executing the `UpsertRateCards` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpsertRateCardsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpsertRateCardsData {
  rateCards_upsert: RateCards_Key;
}
```
### Using `UpsertRateCards`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, upsertRateCards, UpsertRateCardsVariables } from '@dataconnect/generated-server';

// The `UpsertRateCards` mutation requires an argument of type `UpsertRateCardsVariables`:
const upsertRateCardsVars: UpsertRateCardsVariables = {
  createdAt: ..., 
  currency: ..., 
  hourlyRate: ..., 
  id: ..., 
  name: ..., 
  roleId: ..., // optional
  isActive: ..., // optional
};

// Call the `upsertRateCards()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await upsertRateCards(upsertRateCardsVars);
// Variables can be defined inline as well.
const { data } = await upsertRateCards({ createdAt: ..., currency: ..., hourlyRate: ..., id: ..., name: ..., roleId: ..., isActive: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await upsertRateCards(dataConnect, upsertRateCardsVars);

console.log(data.rateCards_upsert);

// Or, you can use the `Promise` API.
upsertRateCards(upsertRateCardsVars).then((response) => {
  const data = response.data;
  console.log(data.rateCards_upsert);
});
```

### Using `UpsertRateCards`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, upsertRateCardsRef, UpsertRateCardsVariables } from '@dataconnect/generated-server';

// The `UpsertRateCards` mutation requires an argument of type `UpsertRateCardsVariables`:
const upsertRateCardsVars: UpsertRateCardsVariables = {
  createdAt: ..., 
  currency: ..., 
  hourlyRate: ..., 
  id: ..., 
  name: ..., 
  roleId: ..., // optional
  isActive: ..., // optional
};

// Call the `upsertRateCardsRef()` function to get a reference to the mutation.
const ref = upsertRateCardsRef(upsertRateCardsVars);
// Variables can be defined inline as well.
const ref = upsertRateCardsRef({ createdAt: ..., currency: ..., hourlyRate: ..., id: ..., name: ..., roleId: ..., isActive: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = upsertRateCardsRef(dataConnect, upsertRateCardsVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.rateCards_upsert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.rateCards_upsert);
});
```

## InsertRoles
You can execute the `InsertRoles` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
insertRoles(vars: InsertRolesVariables): MutationPromise<InsertRolesData, InsertRolesVariables>;

interface InsertRolesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertRolesVariables): MutationRef<InsertRolesData, InsertRolesVariables>;
}
export const insertRolesRef: InsertRolesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
insertRoles(dc: DataConnect, vars: InsertRolesVariables): MutationPromise<InsertRolesData, InsertRolesVariables>;

interface InsertRolesRef {
  ...
  (dc: DataConnect, vars: InsertRolesVariables): MutationRef<InsertRolesData, InsertRolesVariables>;
}
export const insertRolesRef: InsertRolesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the insertRolesRef:
```typescript
const name = insertRolesRef.operationName;
console.log(name);
```

### Variables
The `InsertRoles` mutation requires an argument of type `InsertRolesVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface InsertRolesVariables {
  billableCapacityHours: number;
  createdAt: DateString;
  id: UUIDString;
  name: string;
  isActive?: boolean | null;
}
```
### Return Type
Recall that executing the `InsertRoles` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `InsertRolesData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface InsertRolesData {
  roles_insert: Roles_Key;
}
```
### Using `InsertRoles`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, insertRoles, InsertRolesVariables } from '@dataconnect/generated-server';

// The `InsertRoles` mutation requires an argument of type `InsertRolesVariables`:
const insertRolesVars: InsertRolesVariables = {
  billableCapacityHours: ..., 
  createdAt: ..., 
  id: ..., 
  name: ..., 
  isActive: ..., // optional
};

// Call the `insertRoles()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await insertRoles(insertRolesVars);
// Variables can be defined inline as well.
const { data } = await insertRoles({ billableCapacityHours: ..., createdAt: ..., id: ..., name: ..., isActive: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await insertRoles(dataConnect, insertRolesVars);

console.log(data.roles_insert);

// Or, you can use the `Promise` API.
insertRoles(insertRolesVars).then((response) => {
  const data = response.data;
  console.log(data.roles_insert);
});
```

### Using `InsertRoles`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, insertRolesRef, InsertRolesVariables } from '@dataconnect/generated-server';

// The `InsertRoles` mutation requires an argument of type `InsertRolesVariables`:
const insertRolesVars: InsertRolesVariables = {
  billableCapacityHours: ..., 
  createdAt: ..., 
  id: ..., 
  name: ..., 
  isActive: ..., // optional
};

// Call the `insertRolesRef()` function to get a reference to the mutation.
const ref = insertRolesRef(insertRolesVars);
// Variables can be defined inline as well.
const ref = insertRolesRef({ billableCapacityHours: ..., createdAt: ..., id: ..., name: ..., isActive: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = insertRolesRef(dataConnect, insertRolesVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.roles_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.roles_insert);
});
```

## UpsertRoles
You can execute the `UpsertRoles` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
upsertRoles(vars: UpsertRolesVariables): MutationPromise<UpsertRolesData, UpsertRolesVariables>;

interface UpsertRolesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertRolesVariables): MutationRef<UpsertRolesData, UpsertRolesVariables>;
}
export const upsertRolesRef: UpsertRolesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
upsertRoles(dc: DataConnect, vars: UpsertRolesVariables): MutationPromise<UpsertRolesData, UpsertRolesVariables>;

interface UpsertRolesRef {
  ...
  (dc: DataConnect, vars: UpsertRolesVariables): MutationRef<UpsertRolesData, UpsertRolesVariables>;
}
export const upsertRolesRef: UpsertRolesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the upsertRolesRef:
```typescript
const name = upsertRolesRef.operationName;
console.log(name);
```

### Variables
The `UpsertRoles` mutation requires an argument of type `UpsertRolesVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpsertRolesVariables {
  billableCapacityHours: number;
  createdAt: DateString;
  id: UUIDString;
  name: string;
  isActive?: boolean | null;
}
```
### Return Type
Recall that executing the `UpsertRoles` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpsertRolesData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpsertRolesData {
  roles_upsert: Roles_Key;
}
```
### Using `UpsertRoles`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, upsertRoles, UpsertRolesVariables } from '@dataconnect/generated-server';

// The `UpsertRoles` mutation requires an argument of type `UpsertRolesVariables`:
const upsertRolesVars: UpsertRolesVariables = {
  billableCapacityHours: ..., 
  createdAt: ..., 
  id: ..., 
  name: ..., 
  isActive: ..., // optional
};

// Call the `upsertRoles()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await upsertRoles(upsertRolesVars);
// Variables can be defined inline as well.
const { data } = await upsertRoles({ billableCapacityHours: ..., createdAt: ..., id: ..., name: ..., isActive: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await upsertRoles(dataConnect, upsertRolesVars);

console.log(data.roles_upsert);

// Or, you can use the `Promise` API.
upsertRoles(upsertRolesVars).then((response) => {
  const data = response.data;
  console.log(data.roles_upsert);
});
```

### Using `UpsertRoles`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, upsertRolesRef, UpsertRolesVariables } from '@dataconnect/generated-server';

// The `UpsertRoles` mutation requires an argument of type `UpsertRolesVariables`:
const upsertRolesVars: UpsertRolesVariables = {
  billableCapacityHours: ..., 
  createdAt: ..., 
  id: ..., 
  name: ..., 
  isActive: ..., // optional
};

// Call the `upsertRolesRef()` function to get a reference to the mutation.
const ref = upsertRolesRef(upsertRolesVars);
// Variables can be defined inline as well.
const ref = upsertRolesRef({ billableCapacityHours: ..., createdAt: ..., id: ..., name: ..., isActive: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = upsertRolesRef(dataConnect, upsertRolesVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.roles_upsert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.roles_upsert);
});
```

## InsertTimeEntries
You can execute the `InsertTimeEntries` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
insertTimeEntries(vars: InsertTimeEntriesVariables): MutationPromise<InsertTimeEntriesData, InsertTimeEntriesVariables>;

interface InsertTimeEntriesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertTimeEntriesVariables): MutationRef<InsertTimeEntriesData, InsertTimeEntriesVariables>;
}
export const insertTimeEntriesRef: InsertTimeEntriesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
insertTimeEntries(dc: DataConnect, vars: InsertTimeEntriesVariables): MutationPromise<InsertTimeEntriesData, InsertTimeEntriesVariables>;

interface InsertTimeEntriesRef {
  ...
  (dc: DataConnect, vars: InsertTimeEntriesVariables): MutationRef<InsertTimeEntriesData, InsertTimeEntriesVariables>;
}
export const insertTimeEntriesRef: InsertTimeEntriesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the insertTimeEntriesRef:
```typescript
const name = insertTimeEntriesRef.operationName;
console.log(name);
```

### Variables
The `InsertTimeEntries` mutation requires an argument of type `InsertTimeEntriesVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface InsertTimeEntriesVariables {
  createdAt: DateString;
  date: DateString;
  hours: number;
  id: UUIDString;
  notes?: string | null;
  personId?: UUIDString | null;
  personName?: string | null;
  projectCode?: string | null;
  projectId?: UUIDString | null;
  projectName?: string | null;
}
```
### Return Type
Recall that executing the `InsertTimeEntries` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `InsertTimeEntriesData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface InsertTimeEntriesData {
  timeEntries_insert: TimeEntries_Key;
}
```
### Using `InsertTimeEntries`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, insertTimeEntries, InsertTimeEntriesVariables } from '@dataconnect/generated-server';

// The `InsertTimeEntries` mutation requires an argument of type `InsertTimeEntriesVariables`:
const insertTimeEntriesVars: InsertTimeEntriesVariables = {
  createdAt: ..., 
  date: ..., 
  hours: ..., 
  id: ..., 
  notes: ..., // optional
  personId: ..., // optional
  personName: ..., // optional
  projectCode: ..., // optional
  projectId: ..., // optional
  projectName: ..., // optional
};

// Call the `insertTimeEntries()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await insertTimeEntries(insertTimeEntriesVars);
// Variables can be defined inline as well.
const { data } = await insertTimeEntries({ createdAt: ..., date: ..., hours: ..., id: ..., notes: ..., personId: ..., personName: ..., projectCode: ..., projectId: ..., projectName: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await insertTimeEntries(dataConnect, insertTimeEntriesVars);

console.log(data.timeEntries_insert);

// Or, you can use the `Promise` API.
insertTimeEntries(insertTimeEntriesVars).then((response) => {
  const data = response.data;
  console.log(data.timeEntries_insert);
});
```

### Using `InsertTimeEntries`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, insertTimeEntriesRef, InsertTimeEntriesVariables } from '@dataconnect/generated-server';

// The `InsertTimeEntries` mutation requires an argument of type `InsertTimeEntriesVariables`:
const insertTimeEntriesVars: InsertTimeEntriesVariables = {
  createdAt: ..., 
  date: ..., 
  hours: ..., 
  id: ..., 
  notes: ..., // optional
  personId: ..., // optional
  personName: ..., // optional
  projectCode: ..., // optional
  projectId: ..., // optional
  projectName: ..., // optional
};

// Call the `insertTimeEntriesRef()` function to get a reference to the mutation.
const ref = insertTimeEntriesRef(insertTimeEntriesVars);
// Variables can be defined inline as well.
const ref = insertTimeEntriesRef({ createdAt: ..., date: ..., hours: ..., id: ..., notes: ..., personId: ..., personName: ..., projectCode: ..., projectId: ..., projectName: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = insertTimeEntriesRef(dataConnect, insertTimeEntriesVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.timeEntries_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.timeEntries_insert);
});
```

## UpsertTimeEntries
You can execute the `UpsertTimeEntries` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
upsertTimeEntries(vars: UpsertTimeEntriesVariables): MutationPromise<UpsertTimeEntriesData, UpsertTimeEntriesVariables>;

interface UpsertTimeEntriesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertTimeEntriesVariables): MutationRef<UpsertTimeEntriesData, UpsertTimeEntriesVariables>;
}
export const upsertTimeEntriesRef: UpsertTimeEntriesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
upsertTimeEntries(dc: DataConnect, vars: UpsertTimeEntriesVariables): MutationPromise<UpsertTimeEntriesData, UpsertTimeEntriesVariables>;

interface UpsertTimeEntriesRef {
  ...
  (dc: DataConnect, vars: UpsertTimeEntriesVariables): MutationRef<UpsertTimeEntriesData, UpsertTimeEntriesVariables>;
}
export const upsertTimeEntriesRef: UpsertTimeEntriesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the upsertTimeEntriesRef:
```typescript
const name = upsertTimeEntriesRef.operationName;
console.log(name);
```

### Variables
The `UpsertTimeEntries` mutation requires an argument of type `UpsertTimeEntriesVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpsertTimeEntriesVariables {
  createdAt: DateString;
  date: DateString;
  hours: number;
  id: UUIDString;
  notes?: string | null;
  personId?: UUIDString | null;
  personName?: string | null;
  projectCode?: string | null;
  projectId?: UUIDString | null;
  projectName?: string | null;
}
```
### Return Type
Recall that executing the `UpsertTimeEntries` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpsertTimeEntriesData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpsertTimeEntriesData {
  timeEntries_upsert: TimeEntries_Key;
}
```
### Using `UpsertTimeEntries`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, upsertTimeEntries, UpsertTimeEntriesVariables } from '@dataconnect/generated-server';

// The `UpsertTimeEntries` mutation requires an argument of type `UpsertTimeEntriesVariables`:
const upsertTimeEntriesVars: UpsertTimeEntriesVariables = {
  createdAt: ..., 
  date: ..., 
  hours: ..., 
  id: ..., 
  notes: ..., // optional
  personId: ..., // optional
  personName: ..., // optional
  projectCode: ..., // optional
  projectId: ..., // optional
  projectName: ..., // optional
};

// Call the `upsertTimeEntries()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await upsertTimeEntries(upsertTimeEntriesVars);
// Variables can be defined inline as well.
const { data } = await upsertTimeEntries({ createdAt: ..., date: ..., hours: ..., id: ..., notes: ..., personId: ..., personName: ..., projectCode: ..., projectId: ..., projectName: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await upsertTimeEntries(dataConnect, upsertTimeEntriesVars);

console.log(data.timeEntries_upsert);

// Or, you can use the `Promise` API.
upsertTimeEntries(upsertTimeEntriesVars).then((response) => {
  const data = response.data;
  console.log(data.timeEntries_upsert);
});
```

### Using `UpsertTimeEntries`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, upsertTimeEntriesRef, UpsertTimeEntriesVariables } from '@dataconnect/generated-server';

// The `UpsertTimeEntries` mutation requires an argument of type `UpsertTimeEntriesVariables`:
const upsertTimeEntriesVars: UpsertTimeEntriesVariables = {
  createdAt: ..., 
  date: ..., 
  hours: ..., 
  id: ..., 
  notes: ..., // optional
  personId: ..., // optional
  personName: ..., // optional
  projectCode: ..., // optional
  projectId: ..., // optional
  projectName: ..., // optional
};

// Call the `upsertTimeEntriesRef()` function to get a reference to the mutation.
const ref = upsertTimeEntriesRef(upsertTimeEntriesVars);
// Variables can be defined inline as well.
const ref = upsertTimeEntriesRef({ createdAt: ..., date: ..., hours: ..., id: ..., notes: ..., personId: ..., personName: ..., projectCode: ..., projectId: ..., projectName: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = upsertTimeEntriesRef(dataConnect, upsertTimeEntriesVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.timeEntries_upsert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.timeEntries_upsert);
});
```

## CreateAppUser
You can execute the `CreateAppUser` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createAppUser(vars: CreateAppUserVariables): MutationPromise<CreateAppUserData, CreateAppUserVariables>;

interface CreateAppUserRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateAppUserVariables): MutationRef<CreateAppUserData, CreateAppUserVariables>;
}
export const createAppUserRef: CreateAppUserRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createAppUser(dc: DataConnect, vars: CreateAppUserVariables): MutationPromise<CreateAppUserData, CreateAppUserVariables>;

interface CreateAppUserRef {
  ...
  (dc: DataConnect, vars: CreateAppUserVariables): MutationRef<CreateAppUserData, CreateAppUserVariables>;
}
export const createAppUserRef: CreateAppUserRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createAppUserRef:
```typescript
const name = createAppUserRef.operationName;
console.log(name);
```

### Variables
The `CreateAppUser` mutation requires an argument of type `CreateAppUserVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateAppUserVariables {
  email: string;
  role: string;
  addedBy?: string | null;
}
```
### Return Type
Recall that executing the `CreateAppUser` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateAppUserData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateAppUserData {
  appUsers_insert: AppUsers_Key;
}
```
### Using `CreateAppUser`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createAppUser, CreateAppUserVariables } from '@dataconnect/generated-server';

// The `CreateAppUser` mutation requires an argument of type `CreateAppUserVariables`:
const createAppUserVars: CreateAppUserVariables = {
  email: ..., 
  role: ..., 
  addedBy: ..., // optional
};

// Call the `createAppUser()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createAppUser(createAppUserVars);
// Variables can be defined inline as well.
const { data } = await createAppUser({ email: ..., role: ..., addedBy: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createAppUser(dataConnect, createAppUserVars);

console.log(data.appUsers_insert);

// Or, you can use the `Promise` API.
createAppUser(createAppUserVars).then((response) => {
  const data = response.data;
  console.log(data.appUsers_insert);
});
```

### Using `CreateAppUser`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createAppUserRef, CreateAppUserVariables } from '@dataconnect/generated-server';

// The `CreateAppUser` mutation requires an argument of type `CreateAppUserVariables`:
const createAppUserVars: CreateAppUserVariables = {
  email: ..., 
  role: ..., 
  addedBy: ..., // optional
};

// Call the `createAppUserRef()` function to get a reference to the mutation.
const ref = createAppUserRef(createAppUserVars);
// Variables can be defined inline as well.
const ref = createAppUserRef({ email: ..., role: ..., addedBy: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createAppUserRef(dataConnect, createAppUserVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.appUsers_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.appUsers_insert);
});
```

## UpdateAppUser
You can execute the `UpdateAppUser` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updateAppUser(vars: UpdateAppUserVariables): MutationPromise<UpdateAppUserData, UpdateAppUserVariables>;

interface UpdateAppUserRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateAppUserVariables): MutationRef<UpdateAppUserData, UpdateAppUserVariables>;
}
export const updateAppUserRef: UpdateAppUserRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateAppUser(dc: DataConnect, vars: UpdateAppUserVariables): MutationPromise<UpdateAppUserData, UpdateAppUserVariables>;

interface UpdateAppUserRef {
  ...
  (dc: DataConnect, vars: UpdateAppUserVariables): MutationRef<UpdateAppUserData, UpdateAppUserVariables>;
}
export const updateAppUserRef: UpdateAppUserRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateAppUserRef:
```typescript
const name = updateAppUserRef.operationName;
console.log(name);
```

### Variables
The `UpdateAppUser` mutation requires an argument of type `UpdateAppUserVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdateAppUserVariables {
  id: UUIDString;
  role: string;
}
```
### Return Type
Recall that executing the `UpdateAppUser` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateAppUserData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateAppUserData {
  appUsers_update?: AppUsers_Key | null;
}
```
### Using `UpdateAppUser`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateAppUser, UpdateAppUserVariables } from '@dataconnect/generated-server';

// The `UpdateAppUser` mutation requires an argument of type `UpdateAppUserVariables`:
const updateAppUserVars: UpdateAppUserVariables = {
  id: ..., 
  role: ..., 
};

// Call the `updateAppUser()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateAppUser(updateAppUserVars);
// Variables can be defined inline as well.
const { data } = await updateAppUser({ id: ..., role: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateAppUser(dataConnect, updateAppUserVars);

console.log(data.appUsers_update);

// Or, you can use the `Promise` API.
updateAppUser(updateAppUserVars).then((response) => {
  const data = response.data;
  console.log(data.appUsers_update);
});
```

### Using `UpdateAppUser`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateAppUserRef, UpdateAppUserVariables } from '@dataconnect/generated-server';

// The `UpdateAppUser` mutation requires an argument of type `UpdateAppUserVariables`:
const updateAppUserVars: UpdateAppUserVariables = {
  id: ..., 
  role: ..., 
};

// Call the `updateAppUserRef()` function to get a reference to the mutation.
const ref = updateAppUserRef(updateAppUserVars);
// Variables can be defined inline as well.
const ref = updateAppUserRef({ id: ..., role: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateAppUserRef(dataConnect, updateAppUserVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.appUsers_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.appUsers_update);
});
```

## DeleteAppUser
You can execute the `DeleteAppUser` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
deleteAppUser(vars: DeleteAppUserVariables): MutationPromise<DeleteAppUserData, DeleteAppUserVariables>;

interface DeleteAppUserRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteAppUserVariables): MutationRef<DeleteAppUserData, DeleteAppUserVariables>;
}
export const deleteAppUserRef: DeleteAppUserRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteAppUser(dc: DataConnect, vars: DeleteAppUserVariables): MutationPromise<DeleteAppUserData, DeleteAppUserVariables>;

interface DeleteAppUserRef {
  ...
  (dc: DataConnect, vars: DeleteAppUserVariables): MutationRef<DeleteAppUserData, DeleteAppUserVariables>;
}
export const deleteAppUserRef: DeleteAppUserRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteAppUserRef:
```typescript
const name = deleteAppUserRef.operationName;
console.log(name);
```

### Variables
The `DeleteAppUser` mutation requires an argument of type `DeleteAppUserVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeleteAppUserVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `DeleteAppUser` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteAppUserData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteAppUserData {
  appUsers_delete?: AppUsers_Key | null;
}
```
### Using `DeleteAppUser`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteAppUser, DeleteAppUserVariables } from '@dataconnect/generated-server';

// The `DeleteAppUser` mutation requires an argument of type `DeleteAppUserVariables`:
const deleteAppUserVars: DeleteAppUserVariables = {
  id: ..., 
};

// Call the `deleteAppUser()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteAppUser(deleteAppUserVars);
// Variables can be defined inline as well.
const { data } = await deleteAppUser({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteAppUser(dataConnect, deleteAppUserVars);

console.log(data.appUsers_delete);

// Or, you can use the `Promise` API.
deleteAppUser(deleteAppUserVars).then((response) => {
  const data = response.data;
  console.log(data.appUsers_delete);
});
```

### Using `DeleteAppUser`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteAppUserRef, DeleteAppUserVariables } from '@dataconnect/generated-server';

// The `DeleteAppUser` mutation requires an argument of type `DeleteAppUserVariables`:
const deleteAppUserVars: DeleteAppUserVariables = {
  id: ..., 
};

// Call the `deleteAppUserRef()` function to get a reference to the mutation.
const ref = deleteAppUserRef(deleteAppUserVars);
// Variables can be defined inline as well.
const ref = deleteAppUserRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteAppUserRef(dataConnect, deleteAppUserVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.appUsers_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.appUsers_delete);
});
```

## DeleteTimeEntriesByDate
You can execute the `DeleteTimeEntriesByDate` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
deleteTimeEntriesByDate(vars: DeleteTimeEntriesByDateVariables): MutationPromise<DeleteTimeEntriesByDateData, DeleteTimeEntriesByDateVariables>;

interface DeleteTimeEntriesByDateRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteTimeEntriesByDateVariables): MutationRef<DeleteTimeEntriesByDateData, DeleteTimeEntriesByDateVariables>;
}
export const deleteTimeEntriesByDateRef: DeleteTimeEntriesByDateRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteTimeEntriesByDate(dc: DataConnect, vars: DeleteTimeEntriesByDateVariables): MutationPromise<DeleteTimeEntriesByDateData, DeleteTimeEntriesByDateVariables>;

interface DeleteTimeEntriesByDateRef {
  ...
  (dc: DataConnect, vars: DeleteTimeEntriesByDateVariables): MutationRef<DeleteTimeEntriesByDateData, DeleteTimeEntriesByDateVariables>;
}
export const deleteTimeEntriesByDateRef: DeleteTimeEntriesByDateRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteTimeEntriesByDateRef:
```typescript
const name = deleteTimeEntriesByDateRef.operationName;
console.log(name);
```

### Variables
The `DeleteTimeEntriesByDate` mutation requires an argument of type `DeleteTimeEntriesByDateVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeleteTimeEntriesByDateVariables {
  fromDate: DateString;
}
```
### Return Type
Recall that executing the `DeleteTimeEntriesByDate` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteTimeEntriesByDateData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteTimeEntriesByDateData {
  timeEntries_deleteMany: number;
}
```
### Using `DeleteTimeEntriesByDate`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteTimeEntriesByDate, DeleteTimeEntriesByDateVariables } from '@dataconnect/generated-server';

// The `DeleteTimeEntriesByDate` mutation requires an argument of type `DeleteTimeEntriesByDateVariables`:
const deleteTimeEntriesByDateVars: DeleteTimeEntriesByDateVariables = {
  fromDate: ..., 
};

// Call the `deleteTimeEntriesByDate()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteTimeEntriesByDate(deleteTimeEntriesByDateVars);
// Variables can be defined inline as well.
const { data } = await deleteTimeEntriesByDate({ fromDate: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteTimeEntriesByDate(dataConnect, deleteTimeEntriesByDateVars);

console.log(data.timeEntries_deleteMany);

// Or, you can use the `Promise` API.
deleteTimeEntriesByDate(deleteTimeEntriesByDateVars).then((response) => {
  const data = response.data;
  console.log(data.timeEntries_deleteMany);
});
```

### Using `DeleteTimeEntriesByDate`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteTimeEntriesByDateRef, DeleteTimeEntriesByDateVariables } from '@dataconnect/generated-server';

// The `DeleteTimeEntriesByDate` mutation requires an argument of type `DeleteTimeEntriesByDateVariables`:
const deleteTimeEntriesByDateVars: DeleteTimeEntriesByDateVariables = {
  fromDate: ..., 
};

// Call the `deleteTimeEntriesByDateRef()` function to get a reference to the mutation.
const ref = deleteTimeEntriesByDateRef(deleteTimeEntriesByDateVars);
// Variables can be defined inline as well.
const ref = deleteTimeEntriesByDateRef({ fromDate: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteTimeEntriesByDateRef(dataConnect, deleteTimeEntriesByDateVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.timeEntries_deleteMany);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.timeEntries_deleteMany);
});
```

## DeleteAllTimeEntries
You can execute the `DeleteAllTimeEntries` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
deleteAllTimeEntries(): MutationPromise<DeleteAllTimeEntriesData, undefined>;

interface DeleteAllTimeEntriesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<DeleteAllTimeEntriesData, undefined>;
}
export const deleteAllTimeEntriesRef: DeleteAllTimeEntriesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteAllTimeEntries(dc: DataConnect): MutationPromise<DeleteAllTimeEntriesData, undefined>;

interface DeleteAllTimeEntriesRef {
  ...
  (dc: DataConnect): MutationRef<DeleteAllTimeEntriesData, undefined>;
}
export const deleteAllTimeEntriesRef: DeleteAllTimeEntriesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteAllTimeEntriesRef:
```typescript
const name = deleteAllTimeEntriesRef.operationName;
console.log(name);
```

### Variables
The `DeleteAllTimeEntries` mutation has no variables.
### Return Type
Recall that executing the `DeleteAllTimeEntries` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteAllTimeEntriesData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteAllTimeEntriesData {
  timeEntries_deleteMany: number;
}
```
### Using `DeleteAllTimeEntries`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteAllTimeEntries } from '@dataconnect/generated-server';


// Call the `deleteAllTimeEntries()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteAllTimeEntries();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteAllTimeEntries(dataConnect);

console.log(data.timeEntries_deleteMany);

// Or, you can use the `Promise` API.
deleteAllTimeEntries().then((response) => {
  const data = response.data;
  console.log(data.timeEntries_deleteMany);
});
```

### Using `DeleteAllTimeEntries`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteAllTimeEntriesRef } from '@dataconnect/generated-server';


// Call the `deleteAllTimeEntriesRef()` function to get a reference to the mutation.
const ref = deleteAllTimeEntriesRef();

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteAllTimeEntriesRef(dataConnect);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.timeEntries_deleteMany);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.timeEntries_deleteMany);
});
```

## DeleteBillabilityRules
You can execute the `DeleteBillabilityRules` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
deleteBillabilityRules(vars: DeleteBillabilityRulesVariables): MutationPromise<DeleteBillabilityRulesData, DeleteBillabilityRulesVariables>;

interface DeleteBillabilityRulesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteBillabilityRulesVariables): MutationRef<DeleteBillabilityRulesData, DeleteBillabilityRulesVariables>;
}
export const deleteBillabilityRulesRef: DeleteBillabilityRulesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteBillabilityRules(dc: DataConnect, vars: DeleteBillabilityRulesVariables): MutationPromise<DeleteBillabilityRulesData, DeleteBillabilityRulesVariables>;

interface DeleteBillabilityRulesRef {
  ...
  (dc: DataConnect, vars: DeleteBillabilityRulesVariables): MutationRef<DeleteBillabilityRulesData, DeleteBillabilityRulesVariables>;
}
export const deleteBillabilityRulesRef: DeleteBillabilityRulesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteBillabilityRulesRef:
```typescript
const name = deleteBillabilityRulesRef.operationName;
console.log(name);
```

### Variables
The `DeleteBillabilityRules` mutation requires an argument of type `DeleteBillabilityRulesVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeleteBillabilityRulesVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `DeleteBillabilityRules` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteBillabilityRulesData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteBillabilityRulesData {
  billabilityRules_delete?: BillabilityRules_Key | null;
}
```
### Using `DeleteBillabilityRules`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteBillabilityRules, DeleteBillabilityRulesVariables } from '@dataconnect/generated-server';

// The `DeleteBillabilityRules` mutation requires an argument of type `DeleteBillabilityRulesVariables`:
const deleteBillabilityRulesVars: DeleteBillabilityRulesVariables = {
  id: ..., 
};

// Call the `deleteBillabilityRules()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteBillabilityRules(deleteBillabilityRulesVars);
// Variables can be defined inline as well.
const { data } = await deleteBillabilityRules({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteBillabilityRules(dataConnect, deleteBillabilityRulesVars);

console.log(data.billabilityRules_delete);

// Or, you can use the `Promise` API.
deleteBillabilityRules(deleteBillabilityRulesVars).then((response) => {
  const data = response.data;
  console.log(data.billabilityRules_delete);
});
```

### Using `DeleteBillabilityRules`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteBillabilityRulesRef, DeleteBillabilityRulesVariables } from '@dataconnect/generated-server';

// The `DeleteBillabilityRules` mutation requires an argument of type `DeleteBillabilityRulesVariables`:
const deleteBillabilityRulesVars: DeleteBillabilityRulesVariables = {
  id: ..., 
};

// Call the `deleteBillabilityRulesRef()` function to get a reference to the mutation.
const ref = deleteBillabilityRulesRef(deleteBillabilityRulesVars);
// Variables can be defined inline as well.
const ref = deleteBillabilityRulesRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteBillabilityRulesRef(dataConnect, deleteBillabilityRulesVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.billabilityRules_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.billabilityRules_delete);
});
```

## DeleteBillabilityRuleConditions
You can execute the `DeleteBillabilityRuleConditions` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
deleteBillabilityRuleConditions(vars: DeleteBillabilityRuleConditionsVariables): MutationPromise<DeleteBillabilityRuleConditionsData, DeleteBillabilityRuleConditionsVariables>;

interface DeleteBillabilityRuleConditionsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteBillabilityRuleConditionsVariables): MutationRef<DeleteBillabilityRuleConditionsData, DeleteBillabilityRuleConditionsVariables>;
}
export const deleteBillabilityRuleConditionsRef: DeleteBillabilityRuleConditionsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteBillabilityRuleConditions(dc: DataConnect, vars: DeleteBillabilityRuleConditionsVariables): MutationPromise<DeleteBillabilityRuleConditionsData, DeleteBillabilityRuleConditionsVariables>;

interface DeleteBillabilityRuleConditionsRef {
  ...
  (dc: DataConnect, vars: DeleteBillabilityRuleConditionsVariables): MutationRef<DeleteBillabilityRuleConditionsData, DeleteBillabilityRuleConditionsVariables>;
}
export const deleteBillabilityRuleConditionsRef: DeleteBillabilityRuleConditionsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteBillabilityRuleConditionsRef:
```typescript
const name = deleteBillabilityRuleConditionsRef.operationName;
console.log(name);
```

### Variables
The `DeleteBillabilityRuleConditions` mutation requires an argument of type `DeleteBillabilityRuleConditionsVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeleteBillabilityRuleConditionsVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `DeleteBillabilityRuleConditions` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteBillabilityRuleConditionsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteBillabilityRuleConditionsData {
  billabilityRuleConditions_delete?: BillabilityRuleConditions_Key | null;
}
```
### Using `DeleteBillabilityRuleConditions`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteBillabilityRuleConditions, DeleteBillabilityRuleConditionsVariables } from '@dataconnect/generated-server';

// The `DeleteBillabilityRuleConditions` mutation requires an argument of type `DeleteBillabilityRuleConditionsVariables`:
const deleteBillabilityRuleConditionsVars: DeleteBillabilityRuleConditionsVariables = {
  id: ..., 
};

// Call the `deleteBillabilityRuleConditions()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteBillabilityRuleConditions(deleteBillabilityRuleConditionsVars);
// Variables can be defined inline as well.
const { data } = await deleteBillabilityRuleConditions({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteBillabilityRuleConditions(dataConnect, deleteBillabilityRuleConditionsVars);

console.log(data.billabilityRuleConditions_delete);

// Or, you can use the `Promise` API.
deleteBillabilityRuleConditions(deleteBillabilityRuleConditionsVars).then((response) => {
  const data = response.data;
  console.log(data.billabilityRuleConditions_delete);
});
```

### Using `DeleteBillabilityRuleConditions`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteBillabilityRuleConditionsRef, DeleteBillabilityRuleConditionsVariables } from '@dataconnect/generated-server';

// The `DeleteBillabilityRuleConditions` mutation requires an argument of type `DeleteBillabilityRuleConditionsVariables`:
const deleteBillabilityRuleConditionsVars: DeleteBillabilityRuleConditionsVariables = {
  id: ..., 
};

// Call the `deleteBillabilityRuleConditionsRef()` function to get a reference to the mutation.
const ref = deleteBillabilityRuleConditionsRef(deleteBillabilityRuleConditionsVars);
// Variables can be defined inline as well.
const ref = deleteBillabilityRuleConditionsRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteBillabilityRuleConditionsRef(dataConnect, deleteBillabilityRuleConditionsVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.billabilityRuleConditions_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.billabilityRuleConditions_delete);
});
```

## DeleteBillabilityRuleConditionsByRule
You can execute the `DeleteBillabilityRuleConditionsByRule` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
deleteBillabilityRuleConditionsByRule(vars: DeleteBillabilityRuleConditionsByRuleVariables): MutationPromise<DeleteBillabilityRuleConditionsByRuleData, DeleteBillabilityRuleConditionsByRuleVariables>;

interface DeleteBillabilityRuleConditionsByRuleRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteBillabilityRuleConditionsByRuleVariables): MutationRef<DeleteBillabilityRuleConditionsByRuleData, DeleteBillabilityRuleConditionsByRuleVariables>;
}
export const deleteBillabilityRuleConditionsByRuleRef: DeleteBillabilityRuleConditionsByRuleRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteBillabilityRuleConditionsByRule(dc: DataConnect, vars: DeleteBillabilityRuleConditionsByRuleVariables): MutationPromise<DeleteBillabilityRuleConditionsByRuleData, DeleteBillabilityRuleConditionsByRuleVariables>;

interface DeleteBillabilityRuleConditionsByRuleRef {
  ...
  (dc: DataConnect, vars: DeleteBillabilityRuleConditionsByRuleVariables): MutationRef<DeleteBillabilityRuleConditionsByRuleData, DeleteBillabilityRuleConditionsByRuleVariables>;
}
export const deleteBillabilityRuleConditionsByRuleRef: DeleteBillabilityRuleConditionsByRuleRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteBillabilityRuleConditionsByRuleRef:
```typescript
const name = deleteBillabilityRuleConditionsByRuleRef.operationName;
console.log(name);
```

### Variables
The `DeleteBillabilityRuleConditionsByRule` mutation requires an argument of type `DeleteBillabilityRuleConditionsByRuleVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeleteBillabilityRuleConditionsByRuleVariables {
  ruleId: UUIDString;
}
```
### Return Type
Recall that executing the `DeleteBillabilityRuleConditionsByRule` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteBillabilityRuleConditionsByRuleData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteBillabilityRuleConditionsByRuleData {
  billabilityRuleConditions_deleteMany: number;
}
```
### Using `DeleteBillabilityRuleConditionsByRule`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteBillabilityRuleConditionsByRule, DeleteBillabilityRuleConditionsByRuleVariables } from '@dataconnect/generated-server';

// The `DeleteBillabilityRuleConditionsByRule` mutation requires an argument of type `DeleteBillabilityRuleConditionsByRuleVariables`:
const deleteBillabilityRuleConditionsByRuleVars: DeleteBillabilityRuleConditionsByRuleVariables = {
  ruleId: ..., 
};

// Call the `deleteBillabilityRuleConditionsByRule()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteBillabilityRuleConditionsByRule(deleteBillabilityRuleConditionsByRuleVars);
// Variables can be defined inline as well.
const { data } = await deleteBillabilityRuleConditionsByRule({ ruleId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteBillabilityRuleConditionsByRule(dataConnect, deleteBillabilityRuleConditionsByRuleVars);

console.log(data.billabilityRuleConditions_deleteMany);

// Or, you can use the `Promise` API.
deleteBillabilityRuleConditionsByRule(deleteBillabilityRuleConditionsByRuleVars).then((response) => {
  const data = response.data;
  console.log(data.billabilityRuleConditions_deleteMany);
});
```

### Using `DeleteBillabilityRuleConditionsByRule`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteBillabilityRuleConditionsByRuleRef, DeleteBillabilityRuleConditionsByRuleVariables } from '@dataconnect/generated-server';

// The `DeleteBillabilityRuleConditionsByRule` mutation requires an argument of type `DeleteBillabilityRuleConditionsByRuleVariables`:
const deleteBillabilityRuleConditionsByRuleVars: DeleteBillabilityRuleConditionsByRuleVariables = {
  ruleId: ..., 
};

// Call the `deleteBillabilityRuleConditionsByRuleRef()` function to get a reference to the mutation.
const ref = deleteBillabilityRuleConditionsByRuleRef(deleteBillabilityRuleConditionsByRuleVars);
// Variables can be defined inline as well.
const ref = deleteBillabilityRuleConditionsByRuleRef({ ruleId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteBillabilityRuleConditionsByRuleRef(dataConnect, deleteBillabilityRuleConditionsByRuleVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.billabilityRuleConditions_deleteMany);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.billabilityRuleConditions_deleteMany);
});
```

## DeletePeople
You can execute the `DeletePeople` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
deletePeople(vars: DeletePeopleVariables): MutationPromise<DeletePeopleData, DeletePeopleVariables>;

interface DeletePeopleRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeletePeopleVariables): MutationRef<DeletePeopleData, DeletePeopleVariables>;
}
export const deletePeopleRef: DeletePeopleRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deletePeople(dc: DataConnect, vars: DeletePeopleVariables): MutationPromise<DeletePeopleData, DeletePeopleVariables>;

interface DeletePeopleRef {
  ...
  (dc: DataConnect, vars: DeletePeopleVariables): MutationRef<DeletePeopleData, DeletePeopleVariables>;
}
export const deletePeopleRef: DeletePeopleRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deletePeopleRef:
```typescript
const name = deletePeopleRef.operationName;
console.log(name);
```

### Variables
The `DeletePeople` mutation requires an argument of type `DeletePeopleVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeletePeopleVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `DeletePeople` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeletePeopleData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeletePeopleData {
  people_delete?: People_Key | null;
}
```
### Using `DeletePeople`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deletePeople, DeletePeopleVariables } from '@dataconnect/generated-server';

// The `DeletePeople` mutation requires an argument of type `DeletePeopleVariables`:
const deletePeopleVars: DeletePeopleVariables = {
  id: ..., 
};

// Call the `deletePeople()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deletePeople(deletePeopleVars);
// Variables can be defined inline as well.
const { data } = await deletePeople({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deletePeople(dataConnect, deletePeopleVars);

console.log(data.people_delete);

// Or, you can use the `Promise` API.
deletePeople(deletePeopleVars).then((response) => {
  const data = response.data;
  console.log(data.people_delete);
});
```

### Using `DeletePeople`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deletePeopleRef, DeletePeopleVariables } from '@dataconnect/generated-server';

// The `DeletePeople` mutation requires an argument of type `DeletePeopleVariables`:
const deletePeopleVars: DeletePeopleVariables = {
  id: ..., 
};

// Call the `deletePeopleRef()` function to get a reference to the mutation.
const ref = deletePeopleRef(deletePeopleVars);
// Variables can be defined inline as well.
const ref = deletePeopleRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deletePeopleRef(dataConnect, deletePeopleVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.people_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.people_delete);
});
```

## UpdateTimeEntryPerson
You can execute the `UpdateTimeEntryPerson` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updateTimeEntryPerson(vars: UpdateTimeEntryPersonVariables): MutationPromise<UpdateTimeEntryPersonData, UpdateTimeEntryPersonVariables>;

interface UpdateTimeEntryPersonRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateTimeEntryPersonVariables): MutationRef<UpdateTimeEntryPersonData, UpdateTimeEntryPersonVariables>;
}
export const updateTimeEntryPersonRef: UpdateTimeEntryPersonRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateTimeEntryPerson(dc: DataConnect, vars: UpdateTimeEntryPersonVariables): MutationPromise<UpdateTimeEntryPersonData, UpdateTimeEntryPersonVariables>;

interface UpdateTimeEntryPersonRef {
  ...
  (dc: DataConnect, vars: UpdateTimeEntryPersonVariables): MutationRef<UpdateTimeEntryPersonData, UpdateTimeEntryPersonVariables>;
}
export const updateTimeEntryPersonRef: UpdateTimeEntryPersonRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateTimeEntryPersonRef:
```typescript
const name = updateTimeEntryPersonRef.operationName;
console.log(name);
```

### Variables
The `UpdateTimeEntryPerson` mutation requires an argument of type `UpdateTimeEntryPersonVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdateTimeEntryPersonVariables {
  id: UUIDString;
  personId: UUIDString;
}
```
### Return Type
Recall that executing the `UpdateTimeEntryPerson` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateTimeEntryPersonData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateTimeEntryPersonData {
  timeEntries_update?: TimeEntries_Key | null;
}
```
### Using `UpdateTimeEntryPerson`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateTimeEntryPerson, UpdateTimeEntryPersonVariables } from '@dataconnect/generated-server';

// The `UpdateTimeEntryPerson` mutation requires an argument of type `UpdateTimeEntryPersonVariables`:
const updateTimeEntryPersonVars: UpdateTimeEntryPersonVariables = {
  id: ..., 
  personId: ..., 
};

// Call the `updateTimeEntryPerson()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateTimeEntryPerson(updateTimeEntryPersonVars);
// Variables can be defined inline as well.
const { data } = await updateTimeEntryPerson({ id: ..., personId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateTimeEntryPerson(dataConnect, updateTimeEntryPersonVars);

console.log(data.timeEntries_update);

// Or, you can use the `Promise` API.
updateTimeEntryPerson(updateTimeEntryPersonVars).then((response) => {
  const data = response.data;
  console.log(data.timeEntries_update);
});
```

### Using `UpdateTimeEntryPerson`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateTimeEntryPersonRef, UpdateTimeEntryPersonVariables } from '@dataconnect/generated-server';

// The `UpdateTimeEntryPerson` mutation requires an argument of type `UpdateTimeEntryPersonVariables`:
const updateTimeEntryPersonVars: UpdateTimeEntryPersonVariables = {
  id: ..., 
  personId: ..., 
};

// Call the `updateTimeEntryPersonRef()` function to get a reference to the mutation.
const ref = updateTimeEntryPersonRef(updateTimeEntryPersonVars);
// Variables can be defined inline as well.
const ref = updateTimeEntryPersonRef({ id: ..., personId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateTimeEntryPersonRef(dataConnect, updateTimeEntryPersonVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.timeEntries_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.timeEntries_update);
});
```

