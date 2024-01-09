import { IERC20, buildERC20Contract } from './token/Erc20Token.js';
import {
  IBasicTokenContract,
  buildBasicTokenContract,
} from './token/BasicTokenContract.js';
import { IERC677, buildERC677Contract } from './token/Erc677Token.js';
import { Toolkit } from './Toolkit.js';

export {
  Toolkit,
  IBasicTokenContract,
  buildBasicTokenContract,
  IERC20,
  buildERC20Contract,
  IERC677,
  buildERC677Contract,
};
