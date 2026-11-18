import 'dotenv/config';
import { createApp } from './app';
import { startOverdueWorker } from './jobs/startOverdueWorker';

const port = Number(process.env.PORT || 3000);
const app = createApp();

app.listen(port, () => {
  console.log(`PayPulse listening on port ${port}`);
});

startOverdueWorker();
