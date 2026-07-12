export enum Abnormality {
	AN00 = '00_experience_from_future',
	AN01 = '01_experience_longevity',
	AN02 = '02_experience_reverse',
	AN03 = '03_experience_strange',
	AN04 = '04_experience_user_info',
	AN05 = '05_experience_illusion',
	AN06 = '06_community_illuminati',
	AN07 = '07_community_secret_society',
	AN08 = '08_community_repeatedly',
	AN09 = '09_community_yield_back',
	AN10 = '10_skill_suspicious_language',
	AN11 = '11_skill_kitty',
	AN12 = '12_skill_missing_block',
	AN13 = '13_skill_wizard',
	AN14 = '14_avatar_bear_bleading',
	AN15 = '15_avatar_slogan_strange',
	AN16 = '16_home_footer_hover_hell',
	AN17 = '17_home_footer_strange_licensing',
	AN18 = '18_screen_red',
	AN19 = '19_screen_monochrome',
	AN20 = '20_screen_inverted',
	AN21 = '21_screen_hand',
	AN22 = '22_screen_turn_off',
	AN23 = '23_screen_break',
	AN24 = '24_gameoptions_eye_icon',
	AN25 = '25_gameoptions_alien_language',
	AN26 = '26_gameoptions_give_up'
}

export const abnormalityCodeMap = new Map(
	Object.entries(Abnormality).map(([code, value]) => [value, code as keyof typeof Abnormality])
);

export const abnormalityCodeSet = new Set(Object.keys(Abnormality) as (keyof typeof Abnormality)[]);

export type AbnormalityCode = keyof typeof Abnormality;

export const castAbnormalityCodeToEnum = (code: AbnormalityCode): Abnormality => {
	return Abnormality[code];
};

export const castAbnormalityEnumToCode = (abnormality: Abnormality): AbnormalityCode => {
	return abnormalityCodeMap.get(abnormality) as AbnormalityCode;
};
