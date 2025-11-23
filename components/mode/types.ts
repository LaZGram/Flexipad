export interface LightOutData {
	lightOut: string;
	hitCount: number;
	timeout: number;
}

export interface LightDelayData {
	lightDelay: string;
	delaytime: number;
	randomDelay: number | null;
}

export interface DurationData {
	duration: string;
	hitduration: number;
	minDuration: number;
	secDuration: number;
}

export interface ModeOptionProps {
	mode_type: string;
	mode_selected: string;
	set_mode_selected: (mode: string) => void;
	options: string[];
	description: string;
	icon_name: string;
	render_additional_options?: () => React.ReactNode;
}

export const HIT_COUNT_OPTIONS = [5, 10, 15, 20, 25, 30, 50, 100];
export const LIGHT_DELAY_OPTIONS = [0.3, 0.5, 0.8, 1.0, 1.5, 2.0]; // seconds
export const RANDOM_DELAY_RANGE = [0.3, 3.0]; // min/max seconds