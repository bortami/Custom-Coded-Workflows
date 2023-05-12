const hubspot = require("@hubspot/api-client");

const hubspotClient = new hubspot.Client({
  accessToken: process.env.APPKEY,
});

exports.main = async (event, callback) => {
  const objectId = event.inputFields["hs_object_id"];
  const email = event.inputFields["contact_email"].trim();
  const courseID = event.inputFields["issa_course_id"].trim();


  try {
    
    const certificateSearchResults = await hubspotClient.crm.objects.searchApi.doSearch("2-7900944", {
        filterGroups: [
          {
            filters: [
              {
                propertyName: "contact_email",
                operator: "EQ",
                value: email,
              },
              {
                propertyName: "issa_course_id",
                operator: "EQ",
                value: courseID,
              }
            ],
          },
        ],
        limit: 100,
      	properties: ["issa_course_id", "contact_email"]
      });
    
    //console.log(certificateSearchResults);
    
    var objectsToMerge = [];
    for (let i = 0; i < certificateSearchResults.results.length; i++) {
      const currentObject = certificateSearchResults.results[i];
      if (currentObject.properties.issa_course_id == courseID && currentObject.properties.contact_email == email && currentObject.id !== objectId) {
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
          await hubspotClient.crm.objects.publicObjectApi.merge("2-7900944",{
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
