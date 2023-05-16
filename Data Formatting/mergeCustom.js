const hubspot = require("@hubspot/api-client");

const hubspotClient = new hubspot.Client({
  accessToken: process.env.APPKEY,
});

exports.main = async (event, callback) => {
  const objectId = event.inputFields["hs_object_id"];
  const email = event.inputFields["contact_email"].trim();
  const courseID = event.inputFields["unique_id"].trim();


  try {
    
    const certificateSearchResults = await hubspotClient.crm.objects.searchApi.doSearch("objectType", {
        filterGroups: [
          {
            filters: [
              {
                propertyName: "contact_email",
                operator: "EQ",
                value: email,
              },
              {
                propertyName: "unique_id",
                operator: "EQ",
                value: courseID,
              }
            ],
          },
        ],
        limit: 100,
      	properties: ["unique_id", "contact_email"]
      });
    
    //console.log(certificateSearchResults);
    
    var objectsToMerge = [];
    //you can only merge a maximum of 250 records into one record

    for (let i = 0; i < certificateSearchResults.results.length; i++) {
      const currentObject = certificateSearchResults.results[i];
      if (currentObject.properties.unique_id == courseID && currentObject.properties.contact_email == email && currentObject.id !== objectId) {
          objectsToMerge.push({
            id: currentObject.id
          });
        }
      }
    
    console.log(`there are ${objectsToMerge.length} duplicate objects.`);
    
    if(objectsToMerge.length > 0 ){
    for (let i = 0; i < objectsToMerge.length; i++){
          // Merge certifications
          const currentMergeObject = objectsToMerge[i];
          await hubspotClient.crm.objects.publicObjectApi.merge("objectType",{
            primaryObjectId: objectId,
            objectIdToMerge: currentMergeObject.id,
          });
          console.log(
            currentMergeObject.id +
            "has been merged into " + objectId
          );
          break;
        } 
    } else {
      console.log("No objects to merge.");
    }
  } catch (err) {
    console.error("Hit API rate limit. Will retry.", err);
    // It will automatically retry when the code fails because of a rate limiting error from the HubSpot API.
    throw err;
  }
};
