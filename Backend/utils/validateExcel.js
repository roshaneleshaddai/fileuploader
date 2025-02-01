const { format } = require("date-fns");

const validateExcel = (data, sheetName) => {
  const errors = [];

  data.forEach((row, index) => {
    if (!row.Name || !row.Amount || !row.Date) {
      errors.push({
        row: index + 2,
        message: "Name, Amount, and Date are mandatory",
      });
    }

    if (row.Amount && (isNaN(row.Amount) || row.Amount <= 0)) {
      errors.push({
        row: index + 2,
        message: "Amount must be numeric and greater than zero",
      });
    }

    if (row.Date) {
        let dateParts = row.Date.split("-"); // Assuming "DD-MM-YYYY" format
      
        if (dateParts.length === 3) {
          let day = parseInt(dateParts[0], 10);
          let month = parseInt(dateParts[1], 10) - 1; // ✅ Subtract 1 from month
          let year = parseInt(dateParts[2], 10);
      
          let date = new Date(year, month, day);
          let now = new Date();

      
          // Validate if date is valid and falls in the current month
          if (
            isNaN(date.getTime()) || 
            date.getMonth() !== now.getMonth() ||
            date.getFullYear() !== now.getFullYear()
          ) {
            errors.push({
              row: index + 2,
              message: "Date must be valid and within the current month",
            });
          }
        } else {
          errors.push({
            row: index + 2,
            message: "Invalid date format. Use DD-MM-YYYY.",
          });
        }
      }

    if (row.Verified && !["Yes", "No"].includes(row.Verified)) {
      errors.push({
        row: index + 2,
        message: "Verified must be either Yes or No",
      });
    }
  });

  return errors;
};

module.exports = validateExcel;
