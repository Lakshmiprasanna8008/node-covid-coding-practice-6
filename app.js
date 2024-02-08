const express = require("express");
const path = require("path");
const app = express();
app.use(express.json());
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const dbPath = path.join(__dirname, "covid19India.db");
let db=null;
// Initializing Server and Database
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Started");
    });
  } catch (initError) {
    console.log(initError.message);
    process.exit(1);
  }
};
initializeDbAndServer();

// converting to camelCase
const convertDbObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

//GET ALL STATES LIST API
app.get("/states/", async (request, response) => {
  const getStateListQuery = `
    SELECT * FROM state ORDER BY state_id;
    `;
  const stateList = await db.all(getStateListQuery);
  response.send(
    stateList.map((eachState) => convertDbObjectToResponseObject(eachState))
  );
});

//GET PARTICULAR STATE API
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getParticularStateQuery = `
    SELECT * FROM state WHERE state_id=${stateId};
    `;
  const stateDetail = await db.get(getParticularStateQuery);
  response.send(convertDbObjectToResponseObject(stateDetail));
});

//CREATE A NEW DISTRICT API
app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const createDistrictQuery = `
  INSERT INTO district (district_name,
  state_id,
  cases,
  cured,
  active,
  deaths) VALUES ('${districtName}',${stateId},${cases},${cured},${active},${deaths});
  `;
  await db.run(createDistrictQuery);
  response.send("District Successfully Added");
});

//GET PARTICULAR STATE API
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getParticularDistrictQuery = `
    SELECT * FROM district WHERE district_id=${districtId};
    `;
  const districtDetail = await db.get(getParticularDistrictQuery);
  response.send(convertDbObjectToResponseObject(districtDetail));
});

//DELETE PARTICULAR DISTRICT API
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteParticularDistrictQuery = `
    DELETE FROM district WHERE district_id=${districtId};`;
  await db.run(deleteParticularDistrictQuery);
  response.send("District Removed");
});

//UPDATE  DISTRICT API
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const updateDistrictQuery = `
  UPDATE district SET  district_name = '${districtName}',
  state_id=${stateId},
  cases=${cases},
  cured=${cured},
  active=${active},
  deaths=${deaths}  WHERE district_id = ${districtId};
  `;
  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

//GETTING TOTAL STATS
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStats = `
    SELECT SUM(cases) as totalCases,
    SUM(cured) as totalCured,
    SUM(active) as  totalActive,
    SUM(deaths) as totalDeaths FROM district where state_id=${stateId};`;
  const result = await db.get(getStats);
  // console.log(result);
  response.send(result);
});

//GET STATE WITH DISTRICT API
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateName = `
    SELECT  state.state_name as stateName  FROM district INNER JOIN state ON state.state_id = district.state_id WHERE district_id=${districtId};
    `;
  const stateDetails = await db.get(getStateName);
  // console.log(stateDetails);
  response.send(stateDetails);
});
module.exports = app;
