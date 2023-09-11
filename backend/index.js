const express = require('express');
const { interpret } = require('xstate');
const bodyParser = require('body-parser');
const { Sequelize, DataTypes } = require('sequelize');

// const { Invoice, InvoiceData } = require('./models');
// const InvoiceInvoiceData = Invoice.hasOne(InvoiceData);
// const InvoiceDataInvoiceD = InvoiceData.belongsTo(Invoice);

global.db = {};

const db = global.db;

var cors = require('cors');

const stateMachine = require('./machine');

const machineService = interpret(stateMachine).onTransition((state) => {
  console.log('OOOOOOOOOOOOOOOOOOOOOOOOOO');
  // const isForcefully = state?.event?.payload?.forcefully === true;
  // console.log(
  //   `>> LOG: Event Recieved: ${state._event.name} ${
  //     isForcefully ? 'FORCE' : ''
  //   }\t\tBefore: ${state.history?.value}\t\tAfter: ${state.value}\t\tChanged: ${
  //     state.changed ? 'YES' : 'NO'
  //   }`,
  // );
  // console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
});
machineService.start();

const sequelize = new Sequelize('invoices', 'root', 'Password@123', {
  host: '127.0.0.1',
  dialect: 'mysql',
  port: 4200,
});
db.sequelize = sequelize;
db.DataTypes = DataTypes;

async function connectDB() {
  try {
    await sequelize.authenticate();
    require('./models')(db);
    sequelize.sync();
    // sequelize.sync({ force: true });
    console.log('Connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

connectDB();

// const machineService = interpret(fetchMachine).onTransition((state) => {
//   const isForcefully = state?.event?.payload?.forcefully === true;
//   console.log(
//     `>> LOG: Event Recieved: ${state._event.name} ${
//       isForcefully ? 'FORCE' : ''
//     }\t\tBefore: ${state.history?.value}\t\tAfter: ${state.value}\t\tChanged: ${
//       state.changed ? 'YES' : 'NO'
//     }`,
//   );
//   console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
// });
// machineService.start();

const app = express();
app.use(cors());

app.use(express.json());

app.get('/', (req, res) => {
  res.send('hi');
});

app.get('/invoices', async (req, res) => {
  const { status } = req.query;
  // console.log({ status });

  const { Invoice, InvoiceData } = db;

  const invoices = await Invoice.findAll({
    where: { status },
    include: { model: InvoiceData, as: 'invoiceData' },
  });

  // console.log(invoices);
  res.status(200).json(invoices);
});

app.post('/invoices', async (req, res) => {
  const { message, ids } = req.body;
  console.log({ message, ids });

  const { Invoice, InvoiceData } = db;

  const updated = [];
  const notUpdated = [];

  const invoicesData = await Invoice.findAll({
    where: { id: ids },
    attributes: ['id', 'status'],
  });

  // console.log(invoicesData);

  const service = interpret(
    stateMachine.withContext({
      invoicesData: JSON.parse(JSON.stringify(invoicesData)),
      ids: [],
      updatedIds: [],
      notUpdatedIds: [],
      info: {
        isRequestCompleted: false,
        allUpdated: false,
      },
    }),
  )
    .onTransition((state) => {
      if (!state.changed && state._event.name !== 'xstate.init') {
        state.context.info.isRequestCompleted = true;
        state.context.info.message = `"${state._event.name}" message is NOT accepted.`;
      }
      console.log(
        `>> LOG: Event Recieved: ${state._event.name}\t\tBefore: ${
          state.history?.value
        }\t\tAfter: ${state.value}\t\tChanged: ${state.changed ? 'YES' : 'NO'}`,
      );
    })
    .start(invoicesData[0].status);

  service.send({
    type: message,
  });

  let time = 0;
  while (!service.machine.context.info.isRequestCompleted && time < 5000) {
    await new Promise(async (resolve) => {
      setTimeout(() => resolve(), 200);
    });
    time += 200;
  }
  // console.log('request completed', service.machine.context);

  const { updatedIds, notUpdatedIds, info } = service.machine.context;
  res.status(200).json({
    allUpdated: info.allUpdated,
    message: info.message,
    updatedIds,
    notUpdatedIds,
  });

  // for (let i = 0; i < invoicesData.length; i++) {
  //   const { id, status } = invoicesData[i];
  //   // const state = stateMachine.transition(status, {
  //   //   type: message,
  //   //   invoiceId: id,
  //   // });
  //   console.log({ message });
  //   console.log('NOWW', machineService._state.value);
  //   await machineService.start(status);
  //   console.log('NOWWAFTER', machineService._state.value);
  //   const s = machineService.send({
  //     type: message,
  //   });
  //   // console.log(s);
  //   // console.log(state.changed);
  //   // console.log(state.value);

  //   if (s.changed) {
  //     updated.push(id);
  //   } else {
  //     notUpdated.push(id);
  //   }
  // }

  // res.status(200).json({
  //   allUpdated: updated.length === ids.length,
  //   updated,
  //   notUpdated,
  // });

  // machineService.send(body);
  // // if (type === 'START') {
  // //   // console.log(data);
  // // }
  // // console.log(machineService);
  // const changed = machineService._state.changed;
  // res.send({
  //   currentState: machineService._state.value,
  //   changed,
  //   message: `${machineService._state.event?.type} is ${
  //     changed ? '' : '--NOT--'
  //   } ACCEPTED.`,
  // });
});

app.post('/add-invoice', function (req, res) {
  const { status, message } = req.body;
  const { Invoice, InvoiceData } = db;
  (async () => {
    const transaction = await sequelize.transaction();

    try {
      const invoice = await Invoice.create(
        {
          status: status || null,
        },
        { transaction },
      );

      const invoiceData = await InvoiceData.create(
        {
          invoiceId: invoice.id,
          message,
        },
        { transaction },
      );

      await transaction.commit();
      console.log('Data inserted successfully');
      res.status(201).json({ message: 'OK' });
    } catch (error) {
      await transaction.rollback();
      console.error('Error inserting data:', error);
      res.status(401).json({ message: 'Failed' });
    }
  })();
});

app.post('/reset', function (req, res) {
  const { Invoice, InvoiceData } = db;
  (async () => {
    try {
      const invoices = await Invoice.findAll();

      for (let i = 0; i < invoices.length; i++) {
        invoices[i].status = 'none';
        await invoices[i].save();
        await InvoiceData.update(
          {
            message: 'No message set.',
          },
          {
            where: {
              invoiceId: invoices[i],
            },
          },
        );
      }
      // const invoiceData = await InvoiceData.create(
      //   {
      //     invoiceId: invoice.id,
      //     message,
      //   },
      //   { transaction },
      // );

      console.log('Data reset successfully');
      res.status(201).json({ message: 'OK' });
    } catch (error) {
      console.error('Error Reseting data:', error);
      res.status(401).json({ message: 'Failed' });
    }
  })();
});

app.listen(3000, () => {
  console.log('App is listening at http://localhost:3000/');
});
