export class ConfigLoader {
  private config: Record<string, any> = {};
  
  constructor() {
    Object.assign(this.config, process.env);
  }
  
  get<T>(key: string, defaultValue?: T): T {
    return (this.config[key] !== undefined ? this.config[key] : defaultValue) as T;
  }
  
  set(key: string, value: any): void {
    this.config[key] = value;
  }
}
