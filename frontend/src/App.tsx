import { ChangeEvent, useCallback, useEffect, useState } from 'react';
import './App.css';
import { useLocation } from 'react-router';
import { NavLink } from 'react-router-dom';

const MESSSAGE = {
  initialize: 'INITIALIZE',
  cancel: 'CANCEL',
  validate: 'VALIDATE',
  lock: 'LOCK',
  send: 'SEND',
  dispute: 'DISPUTE',
  disputeAccepted: 'DISPUTE_ACCEPTED',
  disputeRejected: 'DISPUTE_REJECTED',
  archive: 'ARCHIVE',
  forceValidateToArchive: 'FORCE_VALIDATE_TO_ARCHIVE',
};

type Page =
  | ''
  | 'initialized'
  | 'validated'
  | 'locked'
  | 'sent'
  | 'disputed'
  | 'dispute_accepted'
  | 'disputed_accepted'
  | 'archived';

type InvoiceStatus =
  | 'INITIALIZED'
  | 'VALIDATED'
  | 'LOCKED'
  | 'SENT'
  | 'DISPUTED'
  | 'DISPUTE_ACCEPTED'
  | 'ARCHIVED';

type InvoiceDataType = {
  id: number;
  message: string;
  invoiceId: number;
};

type InvoiceType = {
  id: number;
  status: InvoiceStatus;
  invoiceData: InvoiceDataType;
};

function App() {
  const [invoices, setInvoices] = useState<InvoiceType[]>([]);
  const [checkedInvoices, setCheckedInvoices] = useState<number[]>([]);
  const location = useLocation();
  const currentPage = (location.pathname.slice(1) as Page) || 'home';

  console.log(checkedInvoices);

  useEffect(() => {
    setCheckedInvoices([]);
  }, [currentPage]);

  const getInvoices = async (status: string) => {
    await fetch(
      `http://localhost:3000/invoices?status=${
        status === 'home' ? 'none' : status
      }`,
      {
        method: 'GET',
        mode: 'cors',
      },
    )
      .then((res) => res.json())
      .then((res: InvoiceType[]) => {
        console.log(res);
        setInvoices(res);
      })
      .catch((error) => {
        console.log('ERROR:', error);
      });
  };

  const updateStatus = async (message: string, ids: number[]) => {
    await fetch(`http://localhost:3000/invoices`, {
      method: 'POST',
      body: JSON.stringify({
        message,
        ids,
      }),
      headers: {
        'Content-type': 'application/json; charset=UTF-8',
      },
      mode: 'cors',
    })
      .then((res) => res.json())
      .then((res) => {
        const { allUpdated, updatedIds, notUpdatedIds } = res;
        if (!allUpdated) {
          alert(
            `Few invoices are not updated.\n\nUPDATED:\n${updatedIds}\n\n\nNOT UPDATED:\n${notUpdatedIds}`,
          );
        }
        console.log(res);
        getInvoices(currentPage);
        setCheckedInvoices([]);
      })
      .catch((error) => {
        console.log('ERROR:', error);
        setCheckedInvoices([]);
      });
  };

  useEffect(() => {
    getInvoices(currentPage);
  }, [currentPage]);

  const checkboxHandler = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (e) {
        const id = Number((e.target as HTMLInputElement)?.value);
        if (!isNaN(id)) {
          const checked = (e.target as HTMLInputElement)?.checked;
          // debugger;
          if (checked) {
            if (!checkedInvoices.includes(id)) {
              setCheckedInvoices((state) => [...state, id]);
            }
          } else {
            if (checkedInvoices.includes(id)) {
              setCheckedInvoices((state) => state.filter((s) => s !== id));
            }
          }
        }
      }
    },
    [checkedInvoices, setCheckedInvoices],
  );

  return (
    <div className="root">
      <nav>
        <NavLink to={'/'}>HOME</NavLink>
        <NavLink to={'/initialized'}>INITIALIZED</NavLink>
        <NavLink to={'/validated'}>VALIDATED</NavLink>
        <NavLink to={'/locked'}>LOCKED</NavLink>
        <NavLink to={'/sent'}>SENT</NavLink>
        <NavLink to={'/disputed'}>DISPUTED</NavLink>
        <NavLink to={'/dispute_accepted'}>DISPUTED_ACCEPTED</NavLink>
        <NavLink to={'/archived'}>ARCHIVED</NavLink>
      </nav>
      <h1>Page: {currentPage}</h1>
      <section style={{ minWidth: '600px' }}>
        {!invoices.length && 'No Invoice Found.'}
        {invoices.length > 0 && (
          <table className="table table-striped table-bordered table-hover text-start">
            <thead className="text-center">
              <tr>
                <td scope="col">
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setCheckedInvoices(
                          invoices.map((invoice) => invoice.id),
                        );
                      } else {
                        setCheckedInvoices([]);
                      }
                    }}
                    checked={checkedInvoices.length === invoices.length}
                  />
                </td>
                <td scope="col">Invoice ID</td>
                <td scope="col">Status</td>
                <td scope="col">Message</td>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => {
                return (
                  <tr key={invoice.id}>
                    <th scope="row" className="text-center">
                      <input
                        type="checkbox"
                        value={invoice.id}
                        onChange={checkboxHandler}
                        checked={checkedInvoices.includes(invoice.id)}
                      />
                    </th>
                    <td>{invoice.id}</td>
                    <td>
                      {invoice.status || (
                        <i style={{ color: '#a7a7a7' }}>NULL</i>
                      )}
                    </td>
                    <td>{invoice.invoiceData.message}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
      <section className="buttons">
        {currentPage === 'home' && (
          <>
            <button
              className="button"
              disabled={!checkedInvoices.length}
              onClick={() => updateStatus(MESSSAGE.initialize, checkedInvoices)}
            >
              Initialize
            </button>
          </>
        )}
        {currentPage === 'initialized' && (
          <>
            <button
              className="button danger"
              disabled={!checkedInvoices.length}
              onClick={() => updateStatus(MESSSAGE.cancel, checkedInvoices)}
            >
              Cancel
            </button>
            <button
              className="button"
              disabled={!checkedInvoices.length}
              onClick={() => updateStatus(MESSSAGE.validate, checkedInvoices)}
            >
              Validate
            </button>
          </>
        )}
        {currentPage === 'validated' && (
          <>
            <button
              className="button"
              disabled={!checkedInvoices.length}
              onClick={() => updateStatus(MESSSAGE.lock, checkedInvoices)}
            >
              Lock
            </button>
          </>
        )}
        {currentPage === 'locked' && (
          <>
            <button
              className="button"
              disabled={!checkedInvoices.length}
              onClick={() => updateStatus(MESSSAGE.send, checkedInvoices)}
            >
              Send
            </button>
          </>
        )}
        {currentPage === 'sent' && (
          <>
            <button
              className="button"
              disabled={!checkedInvoices.length}
              onClick={() => updateStatus(MESSSAGE.dispute, checkedInvoices)}
            >
              Dispute
            </button>
          </>
        )}
        {currentPage === 'disputed' && (
          <>
            <button
              className="button"
              disabled={!checkedInvoices.length}
              onClick={() =>
                updateStatus(MESSSAGE.disputeRejected, checkedInvoices)
              }
            >
              Dispute Rejected
            </button>
            <button
              className="button"
              disabled={!checkedInvoices.length}
              onClick={() =>
                updateStatus(MESSSAGE.disputeAccepted, checkedInvoices)
              }
            >
              Dispute Accepted
            </button>
          </>
        )}
        {currentPage === 'dispute_accepted' && (
          <>
            <button
              className="button"
              disabled={!checkedInvoices.length}
              onClick={() => updateStatus(MESSSAGE.archive, checkedInvoices)}
            >
              Archive
            </button>
          </>
        )}
        {currentPage === 'archived' && (
          <>
            <h2>Archived, All done!</h2>
          </>
        )}
      </section>
      <section className="buttons">
        <button
          className="button"
          disabled={!checkedInvoices.length}
          onClick={() => updateStatus(MESSSAGE.initialize, checkedInvoices)}
        >
          Initialize
        </button>

        <button
          className="button danger"
          disabled={!checkedInvoices.length}
          onClick={() => updateStatus(MESSSAGE.cancel, checkedInvoices)}
        >
          Cancel
        </button>
        <button
          className="button"
          disabled={!checkedInvoices.length}
          onClick={() => updateStatus(MESSSAGE.validate, checkedInvoices)}
        >
          Validate
        </button>
        <button
          className="button"
          disabled={!checkedInvoices.length}
          onClick={() => updateStatus(MESSSAGE.lock, checkedInvoices)}
        >
          Lock
        </button>
        <button
          className="button"
          disabled={!checkedInvoices.length}
          onClick={() => updateStatus(MESSSAGE.send, checkedInvoices)}
        >
          Send
        </button>
        <button
          className="button"
          disabled={!checkedInvoices.length}
          onClick={() => updateStatus(MESSSAGE.dispute, checkedInvoices)}
        >
          Dispute
        </button>
        <button
          className="button"
          disabled={!checkedInvoices.length}
          onClick={() =>
            updateStatus(MESSSAGE.disputeRejected, checkedInvoices)
          }
        >
          Dispute Rejected
        </button>
        <button
          className="button"
          disabled={!checkedInvoices.length}
          onClick={() =>
            updateStatus(MESSSAGE.disputeAccepted, checkedInvoices)
          }
        >
          Dispute Accepted
        </button>
        <button
          className="button"
          disabled={!checkedInvoices.length}
          onClick={() => updateStatus(MESSSAGE.archive, checkedInvoices)}
        >
          Archive
        </button>
        <button
          className="button"
          disabled={!checkedInvoices.length}
          onClick={() =>
            updateStatus(MESSSAGE.forceValidateToArchive, checkedInvoices)
          }
        >
          FORCE VALIDATE TO ARCHIVE
        </button>
      </section>
    </div>
  );
}

export default App;
