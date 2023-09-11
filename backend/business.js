async function updateStatus(id, status, message) {
  const { Invoice, InvoiceData, sequelize } = global.db;
  const transaction = await sequelize.transaction();
  try {
    await Invoice.update(
      { status },
      {
        where: {
          id,
        },
        transaction,
      },
    );
    const notAllowedId = 6;
    if (id === notAllowedId) {
      throw new Error(`ID ${notAllowedId} is not Allowed for now.`);
    }
    await InvoiceData.update(
      { message },
      {
        where: {
          invoiceId: id,
        },
      },
      { transaction },
    );

    await transaction.commit();
    console.log('Data updated successfully', 'ID:', id);
  } catch (error) {
    await transaction.rollback();
    console.log('Error inserting data:', 'ID:', id);
    throw new Error(error);
  }
}
module.exports = { updateStatus };
