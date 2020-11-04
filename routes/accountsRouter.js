import express from 'express';
import { accountModel } from '../models/accountModel.js';
const app = express();

const INVALID_AGENCY_OR_ACCOUNT =
  'Campo agencia ou conta não foram informadas!';
const NOTFOUND_AGENCY_OR_ACCOUNT = 'Agência e conta não encontradas!';
const INVALID_VALUE = 'Campo value não informado ou menor que zero!';
const INVALID_BALANCE = 'Saldo insuficiente!';

//4. Crie um endpoint para registrar um depósito em uma conta
app.post('/accounts/deposit', async (req, res) => {
  try {
    const { agencia, conta, value } = req.body;
    if (!agencia || !conta) {
      res.status(404).send(INVALID_AGENCY_OR_ACCOUNT);
    }
    if (!value || value < 0) {
      return res.status(404).send(INVALID_VALUE);
    }

    const opts = { returnOriginal: false };
    //funciona as duas opts
    //const opts = { new: true };
    let accountUpdate = await accountModel.findOneAndUpdate(
      { agencia: agencia, conta: conta },
      { $inc: { balance: value } },
      opts
    );
    console.log(accountUpdate);
    if (!accountUpdate) {
      return res.status(404).send(NOTFOUND_AGENCY_OR_ACCOUNT);
    }
    res.send({ balance: accountUpdate.balance + value });
  } catch (error) {
    return res.status(500).send(error);
  }
});

//5. Crie um endpoint para registrar um saque em uma conta e cobrando uma tarifa de saque de (1)
app.post('/accounts/withdraw', async (req, res) => {
  try {
    const { agencia, conta, value } = req.body;
    if (!agencia || !conta) {
      return res.status(404).send(INVALID_AGENCY_OR_ACCOUNT);
    }
    if (!value || value < 0) {
      return res.status(404).send(INVALID_VALUE);
    }
    //valor do saque + 1 real de tarifa
    let withdrawValue = value + 1;
    withdrawValue = -1 * withdrawValue;
    console.log(withdrawValue);
    const account = await accountModel.findOne({
      agencia,
      conta,
    });
    console.log(account);
    console.log(account.balance);
    if (!account) {
      return res.status(404).send(NOTFOUND_AGENCY_OR_ACCOUNT);
    }
    if (account.balance + withdrawValue < 0) {
      return res.status(404).send(INVALID_BALANCE);
    }

    const opts = { returnOriginal: false };
    //funciona as duas opts
    //const opts = { new: true };
    let accountUpdate = await accountModel.findOneAndUpdate(
      { agencia: agencia, conta: conta },
      { $inc: { balance: withdrawValue } },
      opts
    );
    console.log(accountUpdate);

    if (!accountUpdate) {
      return res.status(404).send(NOTFOUND_AGENCY_OR_ACCOUNT);
    }
    res.send({ balance: accountUpdate.balance + withdrawValue });
  } catch (error) {
    return res.status(500).send(error);
  }
});

//6. Crie um endpoint para consultar o saldo da conta.
app.get('/accounts/balance', async (req, res) => {
  try {
    const { agencia, conta } = req.query;
    if (!agencia || !conta) {
      return res.status(404).send(INVALID_AGENCY_OR_ACCOUNT);
    }
    const account = await accountModel.findOne({
      agencia,
      conta,
    });
    if (!account) {
      return res.status(404).send(NOTFOUND_AGENCY_OR_ACCOUNT);
    }

    res.send({ balance: account.balance });
  } catch (error) {
    res.status(500).send(error);
  }
});

//7. Crie um endpoint para excluir uma conta.
//Este endpoint deverá receber como parâmetro a “agência” e o número da conta e retornar o número de contas ativas para esta agência.
app.delete('/accounts/:agencia/:conta', async (req, res) => {
  try {
    const agencia = req.params.agencia;
    const conta = req.params.conta;
    if (!agencia || !conta) {
      return res.status(404).send(INVALID_AGENCY_OR_ACCOUNT);
    }

    const account = await accountModel.deleteOne({
      agencia: agencia,
      conta: conta,
    });
    console.log(account);
    if (account.deletedCount <= 0) {
      return res.status(404).send(NOTFOUND_AGENCY_OR_ACCOUNT);
    }
    const count = await accountModel.countDocuments({ agencia });

    return res.send({ agencia: agencia, countAgencia: count });
  } catch (error) {
    res.status(500).send(error);
  }
});

//8. Crie um endpoint para realizar transferências entre contas.
//Este endpoint deve validar se as contas são da mesma agência para realizar a transferência,
//caso seja de agências distintas o valor de tarifa de transferência (8) deve ser debitado na conta origem.
//O endpoint deverá retornar o saldo da conta origem.
app.patch('/accounts/transferMoney', async (req, res) => {
  try {
    const { contaOrigin, contaDestiny, value } = req.body;
    if (!contaOrigin || !contaDestiny) {
      return res
        .status(404)
        .send('Campo contaOrigin ou contaDestiny não foram informados!');
    }
    if (!value || value < 0) {
      return res.status(404).send(INVALID_VALUE);
    }
    //valor para transferência
    let transferValue = -1 * value;
    const accountOrigin = await accountModel.find({
      conta: contaOrigin,
    });
    if (!accountOrigin) {
      return res.status(404).send('Conta de origem não encontrada!');
    }
    //verificar se a conta de origem tem saldo suficiente
    if (accountOrigin.balance + transferValue < 0) {
      return res.status(404).send(INVALID_BALANCE);
    }

    const accountDestiny = await accountModel.find({
      conta: contaDestiny,
    });
    if (!accountDestiny) {
      return res.status(404).send('Conta de destino não encontrada!');
    }

    const balanceOrigin = accountOrigin[0].balance;
    const agenciaOrigin = accountOrigin[0].agencia;
    const agenciaDestiny = accountDestiny[0].agencia;
    //Se não são da mesma agência, acrescenta tarifa de 8 reais (no caso está negativo porq é um saque)
    if (agenciaOrigin === agenciaDestiny) {
    } else {
      transferValue = transferValue - 8;
      console.log(
        'mesma agencia : ' + accountOrigin.agencia + ' valor: ' + transferValue
      );
      //verificar novamente se a conta de origem tem saldo suficiente
      if (balanceOrigin + transferValue < 0) {
        return res.status(404).send(INVALID_BALANCE);
      }
    }

    const opts = { returnOriginal: false };
    let accountUpdateOrigin = await accountModel.findOneAndUpdate(
      { agencia: agenciaOrigin, conta: contaOrigin },
      { $inc: { balance: transferValue } },
      opts
    );
    console.log('origem: ' + accountUpdateOrigin);
    if (!accountUpdateOrigin) {
      return res.status(404).send(NOTFOUND_AGENCY_OR_ACCOUNT);
    }

    let accountUpdateDestiny = await accountModel.findOneAndUpdate(
      { agencia: agenciaDestiny, conta: contaDestiny },
      { $inc: { balance: value } },
      opts
    );

    if (!accountUpdateDestiny) {
      return res.status(404).send(NOTFOUND_AGENCY_OR_ACCOUNT);
    }
    //valor de origin é positivo, porém o transferValue já está negativo, por isso +
    res.send({
      balanceOrigin: balanceOrigin + transferValue,
      agenciaOrigin: agenciaOrigin,
      agenciaDestiny: agenciaDestiny,
    });
  } catch (error) {
    return res.status(500).send(error);
  }
});

//9. Crie um endpoint para consultar a média do saldo dos clientes de determinada agência.
//O endpoint deverá receber como parâmetro a “agência” e deverá retornar o balance médio da conta.
app.get('/accounts/mediaBalance/:agencia', async (req, res) => {
  try {
    const agencia = req.params.agencia;
    if (!agencia) {
      return res.status(404).send('Agência é obrigatória!');
    }
    const count = await accountModel.countDocuments({ agencia: +agencia });

    const accounts = await accountModel.aggregate([
      {
        $match: { agencia: +agencia },
      },
      {
        $group: {
          _id: null,
          balanceAvg: { $avg: '$balance' },
          total: { $sum: '$balance' },
        },
      },
    ]);

    if (accounts.length === 0) {
      return res.status(404).send('Agência não encontrada!');
    }

    const balanceAvg = accounts[0].balanceAvg;
    const total = accounts[0].total;

    res.send({ mediaBalance: balanceAvg, total: total, count: count });
  } catch (error) {
    res.status(500).send(error);
  }
});

//10. Crie um endpoint para consultar os clientes com o menor saldo em conta. O endpoint
//deverá receber como parâmetro um valor numérico para determinar a quantidade de
//clientes a serem listados, e o endpoint deverá retornar em ordem crescente pelo
//saldo a lista dos clientes (agência, conta, saldo).
app.get('/accounts/smallestBalance', async (req, res) => {
  try {
    const { limit } = req.query;
    if (!limit || limit <= 0) {
      return res.status(404).send('Campo limit não informado ou inválido!');
    }
    const accounts = await accountModel
      .find({}, { _id: 0, name: 0 })
      .sort({ balance: 1 })
      .limit(+limit);
    if (accounts.length === 0 || !accounts) {
      return res.status(404).send('Não foi encontrado nenhum resultado.');
    }
    res.send(accounts);
  } catch (error) {
    res.status(500).send(error);
  }
});

//11. Crie um endpoint para consultar os clientes mais ricos do banco
app.get('/accounts/greatestBalance', async (req, res) => {
  try {
    const { limit } = req.query;
    if (!limit || limit <= 0) {
      return res.status(404).send('Campo limit não informado ou inválido!');
    }
    const accounts = await accountModel
      .find({}, { _id: 0 })
      .sort({ balance: -1 })
      .limit(+limit);
    if (accounts.length === 0 || !accounts) {
      return res.status(404).send('Não foi encontrado nenhum resultado.');
    }
    res.send(accounts);
  } catch (error) {
    res.status(500).send(error);
  }
});

//12. Crie um endpoint que irá transferir o cliente com maior saldo em conta de cada
//agência para a agência private agencia=99. O endpoint deverá retornar a lista dos clientes da agencia private
app.get('/accounts/transferClientToPrivateAgency', async (req, res) => {
  try {
    const accounts = await accountModel.aggregate([
      {
        $sort: { balance: -1 },
      },
      {
        $group: {
          _id: '$agencia',
          id: { $first: '$_id' },
          name: { $first: '$name' },
          agencia: { $first: '$agencia' },
          conta: { $first: '$conta' },
          balance: { $first: '$balance' },
        },
      },
    ]);

    console.log(accounts);

    accounts.forEach(async (account) => {
      await accountModel.findOneAndUpdate(
        { _id: account.id },
        {
          $set: {
            agencia: 99,
          },
        }
      );
    });
    const accountsClientsPrivateAggency = await accountModel.find({
      agencia: 99,
    });

    res.send(accountsClientsPrivateAggency);
  } catch (error) {
    res.status(500).send(error);
  }
});
export { app as accountsRouter };
