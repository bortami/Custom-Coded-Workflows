const hubspot = require("@hubspot/api-client");

const hubspotClient = new hubspot.Client({
  accessToken: process.env.APPKEY,
});

exports.main = async (event, callback) => {
  const {
    recent_referral_franchise_portal_id: shortcode,
  all_referral_portal_ids: all_shortcodes,
  } = event.inputFields;

  let new_all_shortcodes = "";
  let child_portal_id = "";
  let franchise_email = "";
  let success_state = false;
  let error_message = "";
  let connected_company = {};
  let nonconnected_company = {};
  let alert = false;
  let app_installed = false;
  let country = "";
  let usa = false;
  let inactive_company = false;

  try {
    if (!shortcode) {
      error_message = "No shortcode assigned to contact.";
      alert = true;
      console.log("No shortcode assigned to contact.");
    } else {
      const searchResults =
        await hubspotClient.crm.companies.searchApi.doSearch({
          filterGroups: [
            {
              filters: [
                {
                  propertyName: "child_portal_id",
                  operator: "CONTAINS_TOKEN",
                  value: shortcode,
                },
              ],
            },
          ],
          properties: [
            "child_portal_id",
            "franchise_email_name",
            "franchise_status",
            "eligible_for_lead_distro",
            "referral_code",
            "country",
          ],
        });

      if (!searchResults.results[0]) {
        console.error("No companies found from search.");
        error_message = "No companies found from search.";
        alert = true;
      } else {
        connected_company = searchResults.results.find(
          (co) => co.properties.eligible_for_lead_distro === "true"
        );

        if (connected_company) {
          child_portal_id = connected_company.properties.child_portal_id;
          franchise_email =
            connected_company.properties.franchise_email_name;
          app_installed = true;
          country = connected_company.properties.country;
          
          if(connected_company.properties.franchise_status !== "Active Franchise"){
            inactive_company = true;
          }

          if (!franchise_email) {
            console.log("Company is missing franchise POC email address.");
            error_message = "Company is missing franchise POC email address";
            alert = true;
          }

          if (!child_portal_id) {
            console.log("App-eligible company does not have a portal id.");
            error_message = "App-eligible company does not have a portal id.";
            alert = true;
          }
        } else {
          nonconnected_company = searchResults.results.find(
            (co) => co.properties.franchise_status === "Active Franchise"
          );

          if (!nonconnected_company) {
            inactive_company = true;
            country = searchResults.results[0].properties.country;
          } else {
            franchise_email =
              nonconnected_company.properties.franchise_email_name;
            country = nonconnected_company.properties.country;
            if (!franchise_email) {
              console.log("Company is missing franchise POC email address.");
              error_message = "Company is missing franchise POC email address";
              alert = true;
            }
          }
        }

        if (country == "United States" || country == "USA" || country == "US") {
          usa = true;
        }

        if (all_shortcodes) {
          const split_shortcodes = all_shortcodes.split(";");
          const recent_in_all_check = split_shortcodes.includes(shortcode);

          new_all_shortcodes = recent_in_all_check
            ? `${shortcode};`
            : `${all_shortcodes}+${shortcode}`;
        } else {
          new_all_shortcodes = `${shortcode};`;
        }

        success_state = true;
      }
    }
  } catch (err) {
    console.error("Encountered error:", err);
    error_message = err;
    alert = true;
    throw err;
  }
  callback({
    outputFields: {
      success_state: success_state,
      child_portal_id: child_portal_id,
      franchise_email: franchise_email,
      all_shortcodes: new_all_shortcodes,
      error_message: error_message,
      alert: alert,
      app_installed: app_installed,
      usa: usa,
      inactive_company: inactive_company,
    },
  });
};
