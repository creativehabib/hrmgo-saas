// Extend window interface
declare global {
    interface Window {
        appSettings: {
            get: (key: string, defaultValue?: any) => any;
            baseUrl: string;
            imageUrl: string;
            dateFormat: string;
            timeFormat: string;
            timezone: string;
            language: string;
            emailVerification: boolean;
            formatDateTime: (date: string | Date, includeTime?: boolean) => string | null;
            formatCurrency: (amount: number | string, options?: { showSymbol?: boolean, showCode?: boolean }) => string;
            formatTime: (time: string) => string;
            currencySettings: {
                decimalFormat: string;
                defaultCurrency: string;
                decimalSeparator: string;
                thousandsSeparator: string;
                floatNumber: boolean;
                currencySymbolSpace: boolean;
                currencySymbolPosition: string;
                currencySymbol: string;
                currencyCode: string;
                currencyName: string;
            };
        };
    }
}

// Initialize global settings
export function initializeGlobalSettings(settings: Record<string, any>) {
    // Set up currency settings
    const currencySettings = {
        decimalFormat: settings.decimalFormat || '2',
        defaultCurrency: settings.defaultCurrency || 'USD',
        decimalSeparator: settings.decimalSeparator || '.',
        thousandsSeparator: settings.thousandsSeparator || ',',
        floatNumber: settings.floatNumber === '0' ? false : true,
        currencySymbolSpace: settings.currencySymbolSpace === '1',
        currencySymbolPosition: settings.currencySymbolPosition || 'before',
        currencySymbol: settings.currencySymbol || '$',
        currencyCode: settings.currencyCode || 'USD',
        currencyName: settings.currencyNname || 'US Dollar'
    };

    window.appSettings = {
        get: (key: string, defaultValue: any = null) => settings[key] ?? defaultValue,
        baseUrl: settings.base_url ?? 'http://localhost',
        imageUrl: settings.image_url ?? 'http://localhost',
        dateFormat: settings.dateFormat ?? 'yyyy-MM-dd',
        timeFormat: settings.timeFormat ?? 'HH:mm',
        timezone: settings.defaultTimezone ?? 'UTC',
        language: settings.defaultLanguage ?? 'en',
        emailVerification: settings.emailVerification === true || settings.emailVerification === 'true',
        currencySettings,
        formatCurrency: (amount: number | string, options = { showSymbol: true, showCode: false }) => {
            try {

                // Parse the amount
                let numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

                // Format the number with the specified decimal places
                const decimalPlaces = parseInt(currencySettings.decimalFormat);

                // Handle float number setting
                if (!currencySettings.floatNumber) {
                    numAmount = Math.floor(numAmount);
                }

                // Format the number with the specified separators
                const parts = numAmount.toFixed(decimalPlaces).split('.');

                // Format the integer part with thousands separator
                if (currencySettings.thousandsSeparator !== 'none') {
                    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, currencySettings.thousandsSeparator);
                }

                // Join with decimal separator
                let formattedNumber = parts.join(currencySettings.decimalSeparator);

                // Add currency symbol with proper positioning and spacing
                if (options.showSymbol) {
                    const space = currencySettings.currencySymbolSpace ? ' ' : '';

                    if (currencySettings.currencySymbolPosition === 'before') {
                        formattedNumber = `${currencySettings.currencySymbol}${space}${formattedNumber}`;
                    } else {
                        formattedNumber = `${formattedNumber}${space}${currencySettings.currencySymbol}`;
                    }
                }

                // Add currency code if requested
                if (options.showCode) {
                    formattedNumber = `${formattedNumber} ${currencySettings.currencyCode}`;
                }

                return formattedNumber;
            } catch (error) {
                return amount.toString();
            }
        },
        formatDateTime: (date: string | Date, includeTime: boolean = true) => {
            if (!date) return null;

            try {
                // Database stores time in whatever timezone was active, display in current timezone
                const dbDate = typeof date === 'string' ? new Date(date) : date;
                const currentTimezone = settings.defaultTimezone || 'UTC';

                // Convert database time to current timezone
                const utcDate = new Date(dbDate.toLocaleString('en-US', { timeZone: currentTimezone }));
                const companyTimezone = currentTimezone;

                // Convert UTC to company timezone using Intl.DateTimeFormat
                const formatter = new Intl.DateTimeFormat('en-CA', {
                    timeZone: companyTimezone,
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false
                });

                const parts = formatter.formatToParts(utcDate);


                const dateObj = new Date(
                    `${parts.find(p => p.type === 'year')?.value}-${parts.find(p => p.type === 'month')?.value}-${parts.find(p => p.type === 'day')?.value}T${parts.find(p => p.type === 'hour')?.value}:${parts.find(p => p.type === 'minute')?.value}:${parts.find(p => p.type === 'second')?.value}`
                );

                let phpFormat = settings.dateFormat ?? 'D, M j, Y';

                // Add time format if includeTime is true
                if (includeTime) {
                    const timeFormat = settings.timeFormat ?? 'H:i';
                    phpFormat = `${phpFormat} ${timeFormat}`;
                }

                // Dynamic PHP to JS format conversion
                function convertPhpFormat(phpFormat: string, dateObj: Date): string {
                    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
                    const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                    const daysShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

                    return phpFormat.replace(/[a-zA-Z]/g, (match) => {
                        switch (match) {
                            case 'D': return daysShort[dateObj.getDay()];
                            case 'l': return days[dateObj.getDay()];
                            case 'M': return monthsShort[dateObj.getMonth()];
                            case 'F': return months[dateObj.getMonth()];
                            case 'j': return dateObj.getDate().toString();
                            case 'd': return String(dateObj.getDate()).padStart(2, '0');
                            case 'Y': return dateObj.getFullYear().toString();
                            case 'y': return dateObj.getFullYear().toString().slice(-2);
                            case 'm': return String(dateObj.getMonth() + 1).padStart(2, '0');
                            case 'n': return (dateObj.getMonth() + 1).toString();
                            case 'G': return String(dateObj.getHours());
                            case 'H': return String(dateObj.getHours()).padStart(2, '0');
                            case 'g': return String(dateObj.getHours() % 12 || 12);
                            case 'h': return String(dateObj.getHours() % 12 || 12).padStart(2, '0');
                            case 'i': return String(dateObj.getMinutes()).padStart(2, '0');
                            case 's': return String(dateObj.getSeconds()).padStart(2, '0');
                            case 'a': return dateObj.getHours() >= 12 ? 'pm' : 'am';
                            case 'A': return dateObj.getHours() >= 12 ? 'PM' : 'AM';
                            default: return match;
                        }
                    });
                }

                return convertPhpFormat(phpFormat, dateObj);
            } catch (error) {
                return date.toString();
            }
        },
        formatTime: (time: string) => {
            if (!time) return time;

            try {
                const [hours, minutes] = time.split(':');
                if (!hours || !minutes || isNaN(Number(hours)) || isNaN(Number(minutes))) return time;

                const dateObj = new Date();
                dateObj.setHours(Number(hours), Number(minutes), 0, 0);

                const timeFormat = settings.timeFormat ?? 'H:i';

                function convertPhpTimeFormat(phpFormat: string, dateObj: Date): string {
                    return phpFormat.replace(/[a-zA-Z]/g, (match) => {
                        switch (match) {
                            case 'G': return String(dateObj.getHours());
                            case 'H': return String(dateObj.getHours()).padStart(2, '0');
                            case 'g': return String(dateObj.getHours() % 12 || 12);
                            case 'h': return String(dateObj.getHours() % 12 || 12).padStart(2, '0');
                            case 'i': return String(dateObj.getMinutes()).padStart(2, '0');
                            case 's': return String(dateObj.getSeconds()).padStart(2, '0');
                            case 'a': return dateObj.getHours() >= 12 ? 'pm' : 'am';
                            case 'A': return dateObj.getHours() >= 12 ? 'PM' : 'AM';
                            default: return match;
                        }
                    });
                }

                return convertPhpTimeFormat(timeFormat, dateObj);
            } catch (error) {
                return time;
            }
        }
    };
}

export { };