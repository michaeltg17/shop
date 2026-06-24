export interface ShippingAddress {
  name: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export function emptyShipping(): ShippingAddress {
  return {
    name: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zip: '',
    country: '',
  };
}

export function isShippingValid(address: ShippingAddress): boolean {
  return (
    address.name.trim().length >= 2 &&
    address.addressLine1.trim().length >= 5 &&
    address.city.trim().length >= 2 &&
    address.state.trim().length >= 2 &&
    address.zip.trim().length >= 3 &&
    address.country.trim().length >= 2
  );
}
