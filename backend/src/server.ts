import express from 'express';

const app = express();
app.use(express.json());

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => console.log(`API listening on :${port}`));
