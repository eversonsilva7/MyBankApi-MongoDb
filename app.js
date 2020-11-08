import express from 'express';
import { accountsRouter } from './routes/accountsRouter.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

//conectar ao mongoDb pelo mongoose
(async () => {
  try {
    await mongoose.connect(
      `mongodb+srv://${process.env.USERDB}:${process.env.PWDDB}@clusterbootcamp.2monm.mongodb.net/bank?retryWrites=true&w=majority`,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log('Conectado no mongoDB com sucesso.');
  } catch (error) {
    console.log('Erro ao conectar no mongoDb. Detalhe: ' + error);
  }
})();

const app = express();
app.use(express.json());
app.use(accountsRouter);

app.listen(process.env.PORT, () => console.log('API iniciada'));
