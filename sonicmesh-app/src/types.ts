type GraphNode = {
	id: string;
	label: string;
	name: string;
	type?: string;
	image?: string;
	properties?: Record<string, any>;
};

type GraphLink = {
	source: string;
	target: string;
	type: string;
};

type ArtistNode = {
	id: string;
	name: string;
	country?: string;
	image?: string;
};

type ComposerNode = {
	id: string;
	name: string;
	image?: string;
};

type LyricistNode = {
	id: string;
	name: string;
};

type AlbumNode = {
	id: string;
	title: string;
	releaseYear?: number;
	coverImage?: string;
};

type GenreNode = {
	id: string;
	name: string;
};

type MoodNode = {
	id: string;
	name: string;
};

type LanguageNode = {
	id: string;
	name: string;
};

type InstrumentNode = {
	id: string;
	name: string;
	image?: string;
};

type SongDetail = {
	id: string;
	title: string;
	releaseYear: number;
	durationSeconds: number;
	popularity: number;
	coverImage?: string;
	artists: ArtistNode[];
	composers: ComposerNode[];
	lyricists: LyricistNode[];
	album?: AlbumNode;
	genres: GenreNode[];
	moods: MoodNode[];
	languages: LanguageNode[];
	instruments: InstrumentNode[];
	likeCount: number;
	isLiked?: boolean;
};

type RecommendationReason = {
	rule: string;
	points: number;
	explanation: string;
};

type Recommendation = {
	song: {
		id: string;
		title: string;
		releaseYear: number;
		durationSeconds: number;
		popularity: number;
		coverImage?: string;
	};
	artists: string[];
	composers: string[];
	genres: string[];
	moods: string[];
	language: string;
	score: number;
	reasons: RecommendationReason[];
	pathDescription: string;
};

type HomeStats = {
	connected: boolean;
	songCount: number;
	artistCount: number;
	composerCount: number;
	relationshipCount: number;
};

type SearchEntityItem = {
	id: string;
	name: string;
	image?: string;
};

type SearchResults = {
	songs: SearchEntityItem[];
	artists: SearchEntityItem[];
	composers: SearchEntityItem[];
};

type SongsApiPayload = {
	type: 'search' | 'featured';
	songs?: SongDetail[];
	results?: SearchResults;
};

type GraphPathNode = {
	id: string;
	label: string;
	name: string;
	image?: string;
};

type ConnectionResult = {
	connection: {
		nodes: GraphPathNode[];
		relationships: string[];
	} | null;
	startQuery?: string;
	endQuery?: string;
};

type AddSongInput = {
	title: string;
	releaseYear?: number;
	durationSeconds?: number;
	artistName: string;
	composerName: string;
	lyricistName?: string;
	albumTitle?: string;
	genreName: string;
	moodName: string;
	languageName: string;
};