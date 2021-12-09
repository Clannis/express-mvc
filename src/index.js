import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import routes from './routes';
import models, { sequelize } from './models';
import createUsersWithMessages from './utils/seed'

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Set models context
app.use(async (req, res, next) => {  
  req.context = {
    models,
    me: await models.User.findByLogin('rwieruch'),
  };
  next();
});

 // Routing
app.use('/session', routes.session);
app.use('/users', routes.user);
app.use('/messages', routes.message);

// Error Handeling
app.get('*', function (req, res, next) {
  const error = new Error(
    `${req.ip} tried to access ${req.originalUrl}`,
  );

  error.statusCode = 301;

  next(error);});

app.use((error, req, res, next) => {
  if (!error.statusCode) error.statusCode = 500;

  if (error.statusCode === 301) {
    return res.status(301).redirect('/not-found');
  }

  return res
    .status(error.statusCode)
    .json({ error: error.toString() });
});

// Attach database and start server
const eraseDatabaseOnSync = true;

sequelize.sync({ force: eraseDatabaseOnSync }).then(async () => {
  if (eraseDatabaseOnSync) {
    createUsersWithMessages();
  }

  app.listen(process.env.PORT, () =>
    console.log(`Example app listening on port ${process.env.PORT}!`),
  );
});