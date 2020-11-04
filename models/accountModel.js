import mongoose from 'mongoose';

//criando o modelo schema
const accountSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  agencia: {
    type: Number,
    required: true,
  },
  conta: {
    type: Number,
    required: true,
  },
  balance: {
    type: Number,
    required: true,
    min: 0,
  },
});

//definindo o modelo da coleção
const accountModel = mongoose.model('accounts', accountSchema, 'accounts');

export { accountModel };
