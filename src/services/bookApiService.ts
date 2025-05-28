import { Book } from '../types';

interface GoogleBookResponse {
  items?: Array<{
    volumeInfo: {
      title: string;
      authors?: string[];
      imageLinks?: {
        thumbnail: string;
      };
    };
  }>;
}

interface OpenLibraryResponse {
  [key: string]: {
    title: string;
    authors?: Array<{ name: string }>;
    cover?: {
      medium: string;
    };
  };
}

export const fetchBookByISBN = async (isbn: string): Promise<Partial<Book> | null> => {
  try {
    // Try Google Books API first
    const googleResponse = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`);
    const googleData: GoogleBookResponse = await googleResponse.json();

    if (googleData.items?.[0]) {
      const bookInfo = googleData.items[0].volumeInfo;
      return {
        title: bookInfo.title,
        author: bookInfo.authors?.[0] || 'Unknown Author',
        isbn: isbn,
        coverUrl: bookInfo.imageLinks?.thumbnail,
      };
    }

    // Fallback to OpenLibrary API
    const openLibraryResponse = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`);
    const openLibraryData: OpenLibraryResponse = await openLibraryResponse.json();
    
    const bookData = openLibraryData[`ISBN:${isbn}`];
    if (bookData) {
      return {
        title: bookData.title,
        author: bookData.authors?.[0]?.name || 'Unknown Author',
        isbn: isbn,
        coverUrl: bookData.cover?.medium,
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching book data:', error);
    return null;
  }
};