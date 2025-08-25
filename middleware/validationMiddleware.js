import { body, param, validationResult } from 'express-validator';
import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} from '../errors/customErrors.js';
import { JOB_STATUS } from '../utils/constants.js';
import mongoose from 'mongoose';
import Job from '../models/JobModel.js';
import User from '../models/UserModel.js';

const withValidationErrors = (validateValues) => {
  return [
    validateValues,
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const errorMessages = errors.array().map((error) => error.msg);
        if (errorMessages[0].startsWith('No job')) {
          throw new NotFoundError(errorMessages);
        }
        if (errorMessages[0].startsWith('Not authorized to')) {
          throw new UnauthorizedError('Not authorized to access this route');
        }
        throw new BadRequestError(errorMessages);
      }
      next();
    },
  ];
};

export const validateJobInput = withValidationErrors([
  body('vardas').notEmpty().withMessage('Prašome įvesti vardą'),
  body('telefonas').notEmpty().withMessage('Prašome įvesti telefoną'),
  body('adresas').notEmpty().withMessage('Prašome įvesti adresą'),
  body('jobStatus')
    .isIn(Object.values(JOB_STATUS))
    .withMessage('invalid status value'),
]);

export const validateIdParam = withValidationErrors([
  param('id').custom(async (value, { req }) => {
    const isValidId = mongoose.Types.ObjectId.isValid(value);
    if (!isValidId) throw new BadRequestError('invalid mongoDB id');
    const job = await Job.findById(value);
    if (!job) throw new NotFoundError(`No job with such id ${value}`);
    // const isAdmin = req.user.role === 'admin';
    // const isOwner = req.user.userId === job.createdBy.toString();
    // if (!isAdmin && !isOwner)
    //   throw new UnauthorizedError('Not authorized to access this route');
  }),
]);

export const validateRegisterInput = withValidationErrors([
  body('name').notEmpty().withMessage('Privalomas vardas'),
  body('email')
    .notEmpty()
    .withMessage('Reikalingas el.pašto adresas')
    .isEmail()
    .withMessage('Netinkamas el.paštas')
    .custom(async (email) => {
      const user = await User.findOne({ email });
      if (user) {
        throw new Error('Toks el.paštas jau egzistuoja');
      }
    }),
  body('password')
    .notEmpty()
    .withMessage('Reikalingas slaptažodis')
    .isLength({ min: 8 })
    .withMessage('Slaptažodis turi būti sudarytis iš minimum 8 simbolių'),
  body('lastName').notEmpty().withMessage('Reikalinga pavardė'),
]);

export const validateLoginInput = withValidationErrors([
  body('email')
    .notEmpty()
    .withMessage('Reikalingas el.pašto adresas')
    .isEmail()
    .withMessage('Netinkamas el.paštas'),
  body('password').notEmpty().withMessage('Reikalingas slaptažodis'),
]);

export const validateUpdateUserInput = withValidationErrors([
  body('name').notEmpty().withMessage('Privalomas vardas'),
  body('email')
    .notEmpty()
    .withMessage('Reikalingas el.pašto adresas')
    .isEmail()
    .withMessage('Netinkamas el.paštas')
    .custom(async (email, { req }) => {
      const user = await User.findOne({ email });
      if (user && user._id.toString() !== req.user.userId) {
        throw new BadRequestError('Toks el.paštas jau egzistuoja');
      }
    }),
  body('lastName').notEmpty().withMessage('Reikalinga pavardė'),
]);
