import { usePage } from '@inertiajs/react';

// Add window type declaration
declare global {
  interface Window {
    location: Location;
  }
}

/**
 * Get company setting value
 */
// const getCompanySetting = (key: string) => {
//   try {
//     const { props } = usePage();
//     const companySettings = (props as any).companyAllSetting || {};
//     return companySettings[key];
//   } catch {
//     return null;
//   }
// };

/**
 * Get admin setting value
 */
// const getAdminSetting = (key: string) => {
//   try {
//     const { props } = usePage();
//     const adminSettings = (props as any).adminAllSetting || {};
//     return adminSettings[key];
//   } catch {
//     return null;
//   }
// };

/**
 * Format date to readable format
 */
// const formatDate = (date: string | Date): string => {
//   if (!date) return '';
//   const format = getCompanySetting('dateFormat') || 'Y-m-d';
//   const d = new Date(date);
//   const year = d.getFullYear();
//   const month = String(d.getMonth() + 1).padStart(2, '0');
//   const day = String(d.getDate()).padStart(2, '0');

//   return format
//     .replace('Y', String(year))
//     .replace('m', month)
//     .replace('d', day);
// };

/**
 * Format time to readable format
 */
// const formatTime = (time: string): string => {
//   if (!time) return '';
//   const timeFormat = getCompanySetting('timeFormat') || 'H:i';
//   const [hours, minutes] = time.split(':');
//   const h = parseInt(hours);
//   const m = String(parseInt(minutes)).padStart(2, '0');

//   if (timeFormat === 'g:i A') {
//     const period = h >= 12 ? 'PM' : 'AM';
//     const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
//     return `${displayHour}:${m} ${period}`;
//   }

//   return timeFormat
//     .replace('H', String(h).padStart(2, '0'))
//     .replace('i', m);
// };

/**
 * Format date and time to readable format
 */
// const formatDateTime = (date: string | Date): string => {
//   if (!date) return '';
//   const dateFormat = getCompanySetting('dateFormat') || 'Y-m-d';
//   const timeFormat = getCompanySetting('timeFormat') || 'H:i';
//   const d = new Date(date);
//   const year = d.getFullYear();
//   const month = String(d.getMonth() + 1).padStart(2, '0');
//   const day = String(d.getDate()).padStart(2, '0');
//   const hours = String(d.getHours()).padStart(2, '0');
//   const minutes = String(d.getMinutes()).padStart(2, '0');

//   const formattedDate = dateFormat
//     .replace('Y', String(year))
//     .replace('m', month)
//     .replace('d', day);

//   const formattedTime = timeFormat
//     .replace('H', hours)
//     .replace('i', minutes);

//   return `${formattedDate} ${formattedTime}`;
// };

/**
 * Get full image path
 */
const getImagePath = (path: string, pageProps?: any): string => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  // If path already contains storage/media, just prepend domain
  if (path.includes('storage/media')) {
    return path.startsWith('/') ? `${window.location.origin}${path}` : `${window.location.origin}/${path}`;
  }

  try {
    const props = pageProps || usePage().props;
    const dynamicPath = `${(props as any).globalSettings?.base_url || window.location.origin}/storage/media/`;
    let imageUrlPrefix = (props as any).imageUrlPrefix || dynamicPath;

    if (!imageUrlPrefix.includes('storage/media')) {
      imageUrlPrefix = imageUrlPrefix.endsWith('/') ? imageUrlPrefix + 'storage/media/' : imageUrlPrefix + '/storage/media/';
    }

    // Handle slash concatenation
    const prefixEndsWithSlash = imageUrlPrefix.endsWith('/');
    const pathStartsWithSlash = path.startsWith('/');

    if (prefixEndsWithSlash && pathStartsWithSlash) {
      return imageUrlPrefix + path.substring(1);
    } else if (!prefixEndsWithSlash && !pathStartsWithSlash) {
      return imageUrlPrefix + '/' + path;
    } else {
      return imageUrlPrefix + path;
    }
  }
  catch {
    const fallbackPrefix = `${window.location.origin}/${window.location.pathname.split('/')[1]}/storage/media/`;
    return path.startsWith('/') ? fallbackPrefix + path.substring(1) : fallbackPrefix + path;
  }
}


/**
 * Format currency based on saved settings
 */
// const formatCurrency = (amount: number | string): string => {
//   try {
//     const num = Number(amount) || 0;
//     const decimalPlaces = parseInt(getCompanySetting('decimalFormat') || '2');
//     const decimalSeparator = getCompanySetting('decimalSeparator') || '.';
//     const thousandsSeparator = getCompanySetting('thousandsSeparator') || ',';
//     const floatNumber = getCompanySetting('floatNumber') !== '0';
//     const currencySymbolSpace = getCompanySetting('currencySymbolSpace') === '1';
//     const currencySymbolPosition = getCompanySetting('currencySymbolPosition') || 'before';

//     let finalAmount = floatNumber ? num : Math.floor(num);
//     const parts = Number(finalAmount).toFixed(decimalPlaces).split('.');

//     if (thousandsSeparator !== 'none') {
//       parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator);
//     }

//     const formattedNumber = parts.join(decimalSeparator);
//     const symbol = getCurrencySymbol();
//     const space = currencySymbolSpace ? ' ' : '';

//     return currencySymbolPosition === 'before' 
//       ? `${symbol}${space}${formattedNumber}`
//       : `${formattedNumber}${space}${symbol}`;
//   } catch {
//     return `$${Number(amount).toFixed(2)}`;
//   }
// };

// const formatAdminCurrency = (amount: number | string): string => {
//   try {
//     const num = Number(amount) || 0;
//     const decimalPlaces = parseInt(getAdminSetting('decimalFormat') || '2');
//     const decimalSeparator = getAdminSetting('decimalSeparator') || '.';
//     const thousandsSeparator = getAdminSetting('thousandsSeparator') || ',';
//     const floatNumber = getAdminSetting('floatNumber') !== '0';
//     const currencySymbolSpace = getAdminSetting('currencySymbolSpace') === '1';
//     const currencySymbolPosition = getAdminSetting('currencySymbolPosition') || 'before';

//     let finalAmount = floatNumber ? num : Math.floor(num);
//     const parts = Number(finalAmount).toFixed(decimalPlaces).split('.');

//     if (thousandsSeparator !== 'none') {
//       parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator);
//     }

//     const formattedNumber = parts.join(decimalSeparator);
//     const symbol = getAdminSetting('currencySymbol') || '$';
//     const space = currencySymbolSpace ? ' ' : '';

//     return currencySymbolPosition === 'before' 
//       ? `${symbol}${space}${formattedNumber}`
//       : `${formattedNumber}${space}${symbol}`;
//   } catch {
//     return `$${Number(amount).toFixed(2)}`;
//   }
// };

/**
 * Get currency symbol from settings
 */
// const getCurrencySymbol = (): string => {
//   try {
//     return getCompanySetting('currencySymbol') || '$';
//   } catch {
//     return '$';
//   }
// };

// const getAdminCurrencySymbol = (): string => {
//   try {
//     return getAdminSetting('currencySymbol') || '$';
//   } catch {
//     return '$';
//   }
// };

export {
  // formatDate,
  // formatTime,
  // formatDateTime,
  // formatCurrency,
  // formatAdminCurrency,
  // getCurrencySymbol,
  // getAdminCurrencySymbol
  getImagePath,

}