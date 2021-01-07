import { isMobile } from 'proton-shared/lib/helpers/browser';
import { SORT_DIRECTION } from 'proton-shared/lib/constants';
import { SortParams } from './interfaces/link';
import { SupportedMimeTypes } from './utils/MimeTypeParser/constants';
import { LayoutSetting, SortSetting, UserSettings } from './interfaces/userSettings';

export const MB = 1024 * 1024;
export const FOLDER_PAGE_SIZE = 150;
export const BATCH_REQUEST_SIZE = 150;
export const FILE_CHUNK_SIZE = 4 * MB;
export const MEMORY_DOWNLOAD_LIMIT = (isMobile() ? 100 : 1000) * MB;
export const MAX_THREADS_PER_DOWNLOAD = 3;
export const MAX_THREADS_PER_REQUEST = 5;
export const DEFAULT_SORT_FIELD = 'ModifyTime';
export const DEFAULT_SORT_ORDER = SORT_DIRECTION.ASC;
export const DEFAULT_SORT_PARAMS: SortParams = {
    sortField: DEFAULT_SORT_FIELD,
    sortOrder: DEFAULT_SORT_ORDER,
};
export const DEFAULT_USER_SETTINGS: UserSettings = {
    Layout: LayoutSetting.List,
    Sort: SortSetting.ModifiedAsc,
};
export const UPLOAD_TIMEOUT = 60000;
export const DOWNLOAD_TIMEOUT = 60000;
export const EXPENSIVE_REQUEST_TIMEOUT = 60000;
export const MAX_NAME_LENGTH = 255;
export const MIN_SHARED_URL_PASSWORD_LENGTH = 8;

export const DEFAULT_SHARE_MAX_ACCESSES = 10000;

export const MAX_SAFE_UPLOADING_FILE_COUNT = 500;

export const CUSTOM_DATA_FORMAT = 'pd-custom';

export enum LinkURLType {
    FOLDER = 'folder',
    FILE = 'file',
}

export enum EVENT_TYPES {
    DELETE = 0,
    CREATE = 1,
    UPDATE = 2,
    UPDATE_METADATA = 3,
}

export enum EXPIRATION_DAYS {
    NEVER = 'never',
    ONE = '1',
    FIFTEEN = '15',
    THIRTY = '30',
    SIXTY = '60',
    NINETY = '90',
}

export enum STATUS_CODE {
    OK = 200,
    BAD_REQUEST = 400,
    FORBIDDEN = 403,
    NOT_FOUND = 404,
    UNPROCESSABLE_ENTITY = 422,
    INTERNAL_SERVER_ERROR = 500,
}

export enum RESPONSE_CODE {
    SUCCESS = 1000,
    NOT_ALLOWED = 2011,
    ALREADY_EXISTS = 2500,
}

export enum DOWNLOAD_SHARED_STATE {
    ENTER_PASS = 0,
    DOWNLOAD = 1,
    DOES_NOT_EXIST = 2,
}

export const fileDescriptions: { [type: string]: string } = {
    [SupportedMimeTypes.aac]: 'AAC audio',
    [SupportedMimeTypes.avi]: 'AVI: Audio Video Interleave',
    [SupportedMimeTypes.bmp]: 'Windows OS/2 Bitmap Graphics',
    [SupportedMimeTypes.bzip2]: 'BZip2 archive',
    [SupportedMimeTypes.docx]: 'Microsoft Word (OpenXML)',
    [SupportedMimeTypes.eot]: 'MS Embedded OpenType fonts',
    [SupportedMimeTypes.epub]: 'Electronic publication (EPUB)',
    [SupportedMimeTypes.gzip]: 'GZip Compressed Archive',
    [SupportedMimeTypes.gif]: 'Graphics Interchange Format (GIF)',
    [SupportedMimeTypes.ico]: 'Icon format',
    [SupportedMimeTypes.jpg]: 'JPEG images',
    [SupportedMimeTypes.midi]: 'Musical Instrument Digital Interface (MIDI)',
    [SupportedMimeTypes.mpeg]: 'MP3 audio',
    [SupportedMimeTypes.mpg]: 'MPEG Video',
    [SupportedMimeTypes.odp]: 'OpenDocument presentation document',
    [SupportedMimeTypes.ods]: 'OpenDocument spreadsheet document',
    [SupportedMimeTypes.odt]: 'OpenDocument text document',
    [SupportedMimeTypes.oga]: 'OGG audio',
    [SupportedMimeTypes.ogv]: 'OGG video',
    [SupportedMimeTypes.ogg]: 'OGG',
    [SupportedMimeTypes.opus]: 'Opus audio',
    [SupportedMimeTypes.otf]: 'OpenType font',
    [SupportedMimeTypes.png]: 'Portable Network Graphics',
    [SupportedMimeTypes.apng]: 'Animated Portable Network Graphics',
    [SupportedMimeTypes.pdf]: 'Adobe Portable Document Format (PDF)',
    [SupportedMimeTypes.pptx]: 'Microsoft PowerPoint (OpenXML)',
    [SupportedMimeTypes.rar]: 'RAR archive',
    [SupportedMimeTypes.rtf]: 'Rich Text Format (RTF)',
    [SupportedMimeTypes.swf]: 'Small web format (SWF)',
    [SupportedMimeTypes.flv]: 'Flash Video',
    [SupportedMimeTypes.tar]: 'Tape Archive (TAR)',
    [SupportedMimeTypes.tiff]: 'Tagged Image File Format (TIFF)',
    [SupportedMimeTypes.mp2t]: 'MPEG transport stream',
    [SupportedMimeTypes.ttf]: 'TrueType Font',
    [SupportedMimeTypes.webp]: 'WEBP image',
    [SupportedMimeTypes.woff]: 'Web Open Font Format (WOFF)',
    [SupportedMimeTypes.woff2]: 'Web Open Font Format (WOFF)',
    [SupportedMimeTypes.xlsx]: 'Microsoft Excel (OpenXML)',
    [SupportedMimeTypes.xml]: 'XML',
    [SupportedMimeTypes.zip]: 'ZIP archive',
    [SupportedMimeTypes.wav]: 'Waveform Audio Format',
    [SupportedMimeTypes.v3gp]: '3GPP audio/video container',
    [SupportedMimeTypes.v3g2]: '3GPP2 audio/video container',
    [SupportedMimeTypes.x7zip]: '7-zip archive',
    'audio/x-midi': 'Musical Instrument Digital Interface (MIDI)',
    'image/vnd.microsoft.icon': 'Icon format',
    'application/x-bzip': 'BZip archive',
    'application/x-abiword': 'AbiWord document',
    'application/x-freearc': 'Archive document',
    'application/vnd.amazon.ebook': 'Amazon Kindle eBook format',
    'application/octet-stream': 'Binary',
    'application/x-csh': 'C-Shell script',
    'text/x-csh': 'C-Shell script',
    'text/css': 'Cascading Style Sheets (CSS)',
    'text/csv': 'Comma-separated values (CSV)',
    'application/msword': 'Microsoft Word',
    'text/html': 'HyperText Markup Language (HTML)',
    'text/calendar': 'iCalendar format',
    'application/java-archive': 'Java Archive (JAR)',
    'text/javascript': 'JavaScript',
    'application/javascript': 'JavaScript',
    'application/json': 'JSON format',
    'application/ld+json': 'JSON-LD format',
    'application/vnd.apple.installer+xml': 'Apple Installer Package',
    'application/x-httpd-php': 'Hypertext Preprocessor (Personal Home Page)',
    'application/vnd.ms-powerpoint': 'Microsoft PowerPoint',
    'application/x-sh': 'Bourne shell script',
    'image/svg+xml': 'Scalable Vector Graphics(SVG)',
    'text/plain': 'Text',
    'application/vnd.visio': 'Microsoft Visio',
    'audio/webm': 'WEBM audio',
    'video/webm': 'WEBM video',
    'application/xhtml+xml': 'XHTML',
    'application/vnd.ms-excel': 'Microsoft Excel',
    'application/xml': 'XML',
    'application/vnd.mozilla.xul+xml': 'XUL',
    'audio/3gpp': '3GPP audio/video container',
    'audio/3gpp2': '3GPP2 audio/video container',
    'text/x-python': 'Python',
};
