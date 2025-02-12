exports.main = async (event, callback) => {
    try {
        // Get the input date in Unix timestamp (milliseconds) and ensure it's a number
        let inputTimestamp = Number(event.inputFields.contract_start_date); //make sure to add the correct internal name here

        if (isNaN(inputTimestamp)) {
            throw new Error("Invalid date provided.");
        }

        let date = new Date(inputTimestamp); // Convert Unix timestamp to Date object
        let daysAdded = 0;

        while (daysAdded < 3) { //if needing more or less days, change the 3 to the number needed
            date.setDate(date.getDate() + 1);
            if (date.getDay() !== 6 && date.getDay() !== 0) { // Skip Saturdays (6) and Sundays (0)
                daysAdded++;
            }
        }

        // Convert back to Unix timestamp (milliseconds)
        let newTimestamp = date.getTime();
       // Log the new date in a human-readable format
        console.log("New calculated date:", date.toISOString());
        callback({
            outputFields: {
                newDate: newTimestamp
            }
        });
    } catch (error) {
        console.error("Error:", error.message);
        callback({
            outputFields: {
                error: error.message
            }
        });
    }
};
