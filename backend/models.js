module.exports = (db) => {
  const { sequelize, DataTypes } = db;
  const Invoice = sequelize.define(
    'invoice',
    {
      status: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      timestamps: false,
    },
  );

  const InvoiceData = sequelize.define(
    'invoiceData',
    {
      // Model attributes are defined here
      message: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: [2, 30],
        },
      },
    },
    {
      timestamps: false,
    },
  );

  db.Invoice = Invoice;
  db.InvoiceData = InvoiceData;
  db.InvoiceDataInvoice = Invoice.hasOne(InvoiceData, {
    foreignKey: 'invoiceId',
    as: 'invoiceData',
  });
  db.InvoiceInvoiceData = InvoiceData.belongsTo(Invoice);
};
