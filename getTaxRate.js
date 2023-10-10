const HSKEY = process.env.HS_ST_KEY;
const STIQ_KEY = process.env.STIQ_KEY;
const hubspot = require("@hubspot/api-client");
const axios = require("axios");

const hubspotClient = new hubspot.Client({
  accessToken: HSKEY,
});

exports.main = async (event, callback) => {
  const dealId = event.inputFields["hs_object_id"];
  const totalAmount = event.inputFields["amount"];
  const street = event.inputFields["street"];
  const city = event.inputFields["city"];
  const state = event.inputFields["state"];
  const zip = event.inputFields["zip"].toString();
  let taxRate = event.inputFields["sales_tax"];

  let taxLineItemId;
  let taxAmount;
  let sum = 0;

  //get line items
  const dealresponse = await hubspotClient.apiRequest({
    method: "GET",
    path: `/crm/v3/objects/deals/${dealId}?associations=line_item`,
  });
  const deal = await dealresponse.json();

  //get line item ids
  const lineitemIds = deal.associations["line items"].results;
  const lineitemIDCollection = lineitemIds.map((item) => {
    return { id: item.id };
  });
  //get line item details
  const lineitemresponse = await hubspotClient.apiRequest({
    method: "post",
    path: "/crm/v3/objects/line_items/batch/read?",
    body: { properties: ["name", "price"], inputs: lineitemIDCollection },
  });
  const lineitemDetailsCollection = await lineitemresponse.json();
  //find the tax line item id
  const taxLineItem = lineitemDetailsCollection.results.find(
    (item) =>
      item.properties.name == "Tax" ||
      item.properties.name == "tax" ||
      item.properties.name == "Taxes" ||
      item.properties.name == "taxes"
  );

  //get line item
  taxLineItemId = taxLineItem.id;

  //add new deal amount

  lineitemDetailsCollection.results.forEach((price) => {
    if (price.id === taxLineItemId) {
      //do nothing
    } else {
      sum += parseInt(price.properties.price);
    }
  });

  if (sum === totalAmount) {
    sum = totalAmount;
  } else {
    //get tax rate

    const taxRateLookup = await axios({
      method: "post",
      url: "https://api.salestaxiq.com/axkj15gvp8kvhjzm/rates",
      data: {
        street: `${street}`,
        city: `${city}`,
        state: `${state}`,
        zip: `${zip}`,
      },
      headers: {
        "Content-Type": "application/json",
        "X-BLOBR-KEY": STIQ_KEY,
      },
    }).catch((err) => console.error(err));

    taxRate = taxRateLookup.data.tax_rate;
    //calculate taxes
    taxAmount =
      Math.round((totalAmount * (taxRate / 100) + Number.EPSILON) * 100) / 100;
    if (taxLineItem.properties.price === taxAmount) {
      //do nothing
    } else {
      //update tax line amount with taxRate
      const updateTaxAmount = await hubspotClient.apiRequest({
        method: "patch",
        path: `/crm/v3/objects/line_items/${taxLineItemId}`,
        body: { properties: { price: `${taxAmount}` } },
      });
    }
  }
  /*****
      Use the callback function to output data that can be used in later actions in your workflow.
    *****/
  callback({
    outputFields: {
      taxRate: taxRate,
      amount: sum,
    },
  });
};
