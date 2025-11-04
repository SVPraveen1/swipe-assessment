import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Customer {
  id: string;
  name: string;
  phoneNumber: string;
  totalPurchaseAmount: number;
  email?: string;
  address?: string;
  missingFields?: string[];
}

interface CustomersState {
  customers: Customer[];
}

const initialState: CustomersState = {
  customers: [],
};

const customersSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {
    addCustomers: (state, action: PayloadAction<Customer[]>) => {
      state.customers = [...state.customers, ...action.payload];
    },
    updateCustomer: (state, action: PayloadAction<Customer>) => {
      const index = state.customers.findIndex(cust => cust.id === action.payload.id);
      if (index !== -1) {
        state.customers[index] = action.payload;
      }
    },
    deleteCustomer: (state, action: PayloadAction<string>) => {
      state.customers = state.customers.filter(cust => cust.id !== action.payload);
    },
    clearCustomers: (state) => {
      state.customers = [];
    },
  },
});

export const { addCustomers, updateCustomer, deleteCustomer, clearCustomers } = customersSlice.actions;
export default customersSlice.reducer;
