import express from 'express';
import { accountsRouter } from './routes/accountsRouter.js';
import mongoose from 'mongoose';
//conectar ao mongoDb pelo mongoose
(async () => {
  try {
    await mongoose.connect(
      'mongodb+srv://bootcamp2020:bootcamp2020@clusterbootcamp.2monm.mongodb.net/bank?retryWrites=true&w=majority',
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

app.listen(3000, () => console.log('API iniciada'));
