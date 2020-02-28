import { Connection, Repository } from 'typeorm';
import { User } from './user.entity';
export declare class UserService {
    private readonly userRepository;
    private readonly connection;
    constructor(userRepository: Repository<User>, connection: Connection);
    findAllNonAdmin(): Promise<User[]>;
    findAllFromMyMonitor(): Promise<User[]>;
    findById(id: string): Promise<User>;
    findByUsername(username: string): Promise<User | undefined>;
    findNumberOfStudyMonitor(): Promise<number>;
    findNumberOfMyMonitor(): Promise<number>;
    createOne(user: User, websites: string[], transfer: boolean): Promise<boolean>;
    remove(id: string): Promise<void>;
}