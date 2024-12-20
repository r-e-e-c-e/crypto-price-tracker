export function wait(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getLastUpdatedLabel() {
	const now = new Date(Date.now());
	return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
}

export function formatNumber(num: number): string {
	if (num < 10000) {
		return num.toFixed(2).toString(); // Show the number as is if less than 100K
	} else if (num >= 10000 && num < 1000000) {
		return (num / 1000).toFixed(2) + 'K'; // Convert to thousands (K)
	} else if (num >= 1000000 && num < 1000000000) {
		return (num / 1000000).toFixed(2) + 'M'; // Convert to millions (M)
	} else {
		return (num / 1000000000).toFixed(2) + 'B'; // Convert to billions (B)
	}
}
