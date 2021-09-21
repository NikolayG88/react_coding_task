class Format {
    static currency(amount: number): string {
        return new Intl.NumberFormat('en-US',
            { style: 'currency', currency: 'EUR' }
        ).format(amount);
    }

    static currencyNoSign(amount: number): string {
        const result = new Intl.NumberFormat('en-US',
            { style: 'currency', currency: 'EUR' })
            .format(amount);
        return result.substr(1, result.length);

    }

    static number(num: number) {
        return new Intl.NumberFormat('en-US').format(num);
    }

    static date(date: Date | string) {
        const d = new Date(date);
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    }
}

export default Format;
