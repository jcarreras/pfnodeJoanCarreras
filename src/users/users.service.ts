import {
BadRequestException,
Injectable,
InternalServerErrorException,
NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { CreateUserDto } from './dto/create-user.dto';
import type { FindUsersQueryDto } from './dto/find-users-query.dto';
import type { UpdateUserDto } from './dto/update-user.dto';
import { User } from './user.entity';
import 'dotenv/config';
import OpenAI from 'openai';
import type { Resource } from '../resources/resource.entity';
import { ResourcesService } from '../resources/resources.service';
import {ParseResourceAssignmentDto} from './dto/parse-resource-assignment.dto';

type ResourceAssignmentIds = {
  userId: number;
  resourceId: number;
};

@Injectable()
export class UsersService {

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly resourcesService: ResourcesService,
  ) {}

  private client?: OpenAI;
  private readonly model = process.env.OPENAI_MODEL ?? 'gpt-4.1-mini';

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

  private getClient(): OpenAI {
    if (!process.env.OPENAI_API_KEY) {
      throw new InternalServerErrorException(
        'OPENAI_API_KEY is not configured',
      );
    }

    this.client ??= new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    return this.client;
  }
  async parseResourceAssignment(
    parseResourceAssignmentDto: ParseResourceAssignmentDto,
  ): Promise<Resource> {
     const response = await this.getClient().responses.create({
      model: this.model,
      input: [
        {
          role: 'system',
          content:
            'Extract resource assignment ids from the user command. ' +
            'Return ONLY a valid JSON object with exactly two fields: ' +
            '{"userId": <number>, "resourceId": <number>}. ' +
            'No extra text, no markdown, no code blocks.',
        },
        {
          role: 'user',
          content: parseResourceAssignmentDto.command,
        },
      ],
    });
    console.log('OpenAI raw response:', JSON.stringify(response.output_text));
    const parsedAssignment = this.parseAssignmentJson(response.output_text);
    if ('error' in parsedAssignment) {
      throw new BadRequestException('userId and resourceId are required');
    }
    return this.resourcesService.assign(parsedAssignment.resourceId, {
      userId: parsedAssignment.userId,
    });
  }

  private parseAssignmentJson(
    outputText: string,
  ): ResourceAssignmentIds | { error: string } {
    const jsonMatch = outputText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new BadRequestException('OpenAI did not return valid JSON');
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      throw new BadRequestException('OpenAI did not return valid JSON');
    }
    if (typeof parsed === 'object' && parsed !== null && 'error' in parsed) {
      return { error: String(parsed.error) };
    }
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !('userId' in parsed) ||
      !('resourceId' in parsed) ||
      typeof parsed.userId !== 'number' ||
      typeof parsed.resourceId !== 'number'
    ) {
      throw new BadRequestException(
        'OpenAI did not return userId and resourceId',
      );
    }
    return {
      userId: parsed.userId,
      resourceId: parsed.resourceId,
    };
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