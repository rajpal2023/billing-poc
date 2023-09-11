import { createBrowserRouter } from 'react-router-dom';
import App from './App';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: '/initialized',
        element: <App />,
      },
      {
        path: '/validated',
        element: <App />,
      },
      {
        path: '/locked',
        element: <App />,
      },
      {
        path: '/sent',
        element: <App />,
      },
      {
        path: '/disputed',
        element: <App />,
      },
      {
        path: '/dispute_accepted',
        element: <App />,
      },
      {
        path: '/archived',
        element: <App />,
      },
    ],
  },
]);

export default router;
