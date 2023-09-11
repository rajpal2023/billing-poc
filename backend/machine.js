const { createMachine, assign } = require('xstate');
const { updateStatus } = require('./business');

const stateMachine = createMachine(
  {
    id: 'billing',
    predictableActionArguments: true,
    initial: 'none',

    // States
    states: {
      cancelled: {},
      archived: {},
      none: {
        on: {
          INITIALIZE: {
            target: 'initialized',
            actions: ['assignState', 'commonHandler'],
          },
        },
      },
      initialized: {
        on: {
          CANCEL: {
            target: 'cancelled',
            actions: ['assignState', 'commonHandler'],
          },
          VALIDATE: {
            target: 'validated',
            actions: ['assignState', 'commonHandler'],
          },
        },
      },
      validated: {
        on: {
          LOCK: {
            target: 'locked',
            actions: ['assignState', 'commonHandler'],
          },
          FORCE_VALIDATE_TO_ARCHIVE: {
            target: 'archived',
            actions: ['assignState', 'commonHandler'],
          },
        },
      },
      locked: {
        on: {
          SEND: {
            target: 'sent',
            actions: ['assignState', 'commonHandler'],
          },
        },
      },
      sent: {
        on: {
          DISPUTE: {
            target: 'disputed',
            actions: ['assignState', 'commonHandler'],
          },
        },
      },
      disputed: {
        on: {
          DISPUTE_ACCEPTED: {
            target: 'dispute_accepted',
            actions: ['assignState', 'commonHandler'],
          },
          DISPUTE_REJECTED: {
            target: 'sent',
            actions: ['assignState', 'commonHandler'],
          },
        },
      },
      dispute_accepted: {
        on: {
          ARCHIVE: {
            target: 'archived',
            actions: ['assignState', 'commonHandler'],
          },
        },
      },
    },
  },
  {
    actions: {
      assignState: assign((context, event) => {
        const newState = {
          INITIALIZE: 'initialized',
          CANCEL: 'none',
          VALIDATE: 'validated',
          LOCK: 'locked',
          SEND: 'sent',
          DISPUTE: 'disputed',
          DISPUTE_ACCEPTED: 'dispute_accepted',
          DISPUTE_REJECTED: 'sent',
          ARCHIVE: 'archived',
          FORCE_VALIDATE_TO_ARCHIVE: 'archived',
        };
        return {
          ...context,
          newState: newState[event.type],
        };
      }),
      commonHandler: async function (context, event, a, d) {
        // console.log('this', stateMachine);
        // console.log('event', event);
        // console.log('context 4', context);

        for (let i = 0; i < context.invoicesData.length; i++) {
          const { id, status } = context.invoicesData[i];
          context.ids.push(id);
          try {
            await updateStatus(
              id,
              context.newState,
              `New status is ${context.newState}`,
            );
            context.updatedIds.push(id);
          } catch (error) {
            context.notUpdatedIds.push(id);
            console.log(error);
          }
        }

        console.log(context.updatedIds);
        console.log(context.invoicesData);

        context.info.isRequestCompleted = true;
        context.info.allUpdated =
          context.updatedIds.length === context.invoicesData.length;
      },
    },
  },
);

module.exports = stateMachine;
