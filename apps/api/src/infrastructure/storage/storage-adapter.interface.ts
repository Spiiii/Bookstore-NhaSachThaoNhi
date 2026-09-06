export const STORAGE_ADAPTER = Symbol('STORAGE_ADAPTER');

export interface StoredObject {
  readonly key: string;
  readonly size: number;
}

export interface StorageAdapter {
  put(data: Uint8Array): Promise<StoredObject>;
  read(key: string): Promise<Buffer>;
  /** Idempotent when the object is already absent. Other filesystem errors propagate. */
  delete(key: string): Promise<void>;
}
