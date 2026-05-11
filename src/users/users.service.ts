import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { CreateUserDto } from './dto/create-user.dto';
import type { FindUsersQueryDto } from './dto/find-users-query.dto';
import type { UpdateUserDto } from './dto/update-user.dto';
import { User } from './user.entity';

@Injectable()
export class UsersService {

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  findAll(query: FindUsersQueryDto): Promise<User[]> {
    const { active, role } = query;
    //  return this.usersRepository.find();
    return this.usersRepository.findBy({
      ...(active !== undefined && { active }),
      ...(role !== undefined && { role }),
    });
  }

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

  create(createUserDto: CreateUserDto): Promise<User> {
    const newUser = this.usersRepository.create({
      ...createUserDto,
      active: true,
      createdAt: new Date().toISOString(),
    });
    return this.usersRepository.save(newUser);
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id); // ja llança NotFoundException si no existeix
    const updated = this.usersRepository.merge(user, updateUserDto);
    return this.usersRepository.save(updated);
  }

  async remove(id: number): Promise<User> {
    const user = await this.findOne(id); // ja llança NotFoundException si no existeix
    return this.usersRepository.remove(user);
  }
}

/*   private users: User[] = [
    {
      id: 1,
      name: 'Anna Serra',
      email: 'anna@example.com',
      role: 'member',
      active: true,
      createdAt: new Date().toISOString(),
    },
  ]; */

/*   findAll(query: FindUsersQueryDto): User[] {
    const { active, role } = query;

    return this.users.filter((user) => {
      const matchesActive = active === undefined || user.active === active;
      const matchesRole = role === undefined || user.role === role;

      return matchesActive && matchesRole;
    });
  } */



/*   findOne(id: number): User {
    const user = this.users.find((currentUser) => currentUser.id === id);

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return user;
  } */

  /*   create(createUserDto: CreateUserDto): User {
    const newUser: User = {
      id: this.users.length + 1,
      name: createUserDto.name,
      email: createUserDto.email,
      role: createUserDto.role,
      active: true,
      createdAt: new Date().toISOString(),
    };

    this.users.push(newUser);

    return newUser;
  } */


/*   update(id: number, updateUserDto: UpdateUserDto): User {
    const userIndex = this.users.findIndex((user) => user.id === id);

    if (userIndex === -1) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    const currentUser = this.users[userIndex];
    const {
      name = currentUser.name,
      email = currentUser.email,
      role = currentUser.role,
      active = currentUser.active,
    } = updateUserDto;

    this.users[userIndex] = {
      ...currentUser,
      name,
      email,
      role,
      active,
    };

    return this.users[userIndex];
  } */

    /*   remove(id: number): User {
    const userIndex = this.users.findIndex((user) => user.id === id);

    if (userIndex === -1) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    const [deletedUser] = this.users.splice(userIndex, 1);

    return deletedUser;
  } */