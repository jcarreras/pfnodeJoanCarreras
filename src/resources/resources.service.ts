import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { CreateResourceDto } from './dto/create-resource.dto';
import type { FindResourcesQueryDto } from './dto/find-resources-query.dto';
import type { UpdateResourceDto } from './dto/update-resource.dto';
import type { AssignResourceDto } from './dto/assign-resource.dto';
import { Resource } from './resource.entity';
import {User} from '../users/user.entity';

@Injectable()
export class ResourcesService {
  constructor(
    @InjectRepository(Resource)
    private readonly resourcesRepository: Repository<Resource>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  findAll(query: FindResourcesQueryDto): Promise<Resource[]> {
    const {  type, status } = query;
    //  return this.resourcesRepository.find();
    return this.resourcesRepository.findBy({
      ...(type !== undefined && { type }),
      ...(status !== undefined && { status }),
    });
  }
  
  async findOne(id: number): Promise<Resource> {
    const resource = await this.resourcesRepository.findOneBy({ id });
    if (!resource) {
      throw new NotFoundException(`Resource with id ${id} not found`);
    }
    return resource;
  }

  create(createResourceDto: CreateResourceDto): Promise<Resource> {
    const newResource = this.resourcesRepository.create({
      ...createResourceDto,
      status: 'available',       
      createdAt: new Date().toISOString(),
    });
    return this.resourcesRepository.save(newResource);
  }

  async update(id: number, updateResourceDto: UpdateResourceDto): Promise<Resource> {
    const resource = await this.findOne(id); 
    const updated = this.resourcesRepository.merge(resource, updateResourceDto);
    return this.resourcesRepository.save(updated);
  }

  async remove(id: number): Promise<Resource> {
    const resource = await this.findOne(id);
    return this.resourcesRepository.remove(resource);
  }

  async assign(id: number, assignResourceDto: AssignResourceDto): Promise<Resource> {
    const resource = await this.findOne(id);
    const user = await this.usersRepository.findOneBy({ id: assignResourceDto.userId });
    if (!user) {
      throw new NotFoundException(`User with id ${assignResourceDto.userId} not found`);
    }
    if (resource.status === 'assigned') {
      throw new BadRequestException(`Resource with id ${id} is already assigned`);
    }
    resource.status = 'assigned';
    resource.assignedToUserId = assignResourceDto.userId;
    return this.resourcesRepository.save(resource);
  }

  async release(id: number): Promise<Resource> {
    const resource = await this.findOne(id);

    resource.status = 'available';
    resource.assignedToUserId = null;
    resource.assignedToUser = null;
    await this.resourcesRepository.save(resource);

    return this.findOne(id); // recarreguem des de la BD
  }

}



/*   private resources: Resource[] = [
    {
      id: 1,
      name: 'portàtil',
      type: 'laptop',
      status: 'assigned',
      location: 'Aula 220',
      createdAt: new Date().toISOString(),
    },
  ];

  findAll(query: FindResourcesQueryDto): Resource[] {
    const { type, status } = query;

    return this.resources.filter((resource) => {
      const matchesType = type === undefined || resource.type === type;
      const matchesStatus = status === undefined || resource.status === status;

      return matchesType && matchesStatus;
    });
  }


  findOne(id: number): Resource {
    const resource = this.resources.find((currentResource) => currentResource.id === id);

    if (!resource) {
      throw new NotFoundException(`404. Resource with id ${id} not found`);
    }

    return resource;
  }


  create(createResourceDto: CreateResourceDto): Resource {
    const newResource: Resource = {
      id: this.resources.length + 1,
      ...createResourceDto,
      status: 'available',        // valor per defecte
      createdAt: new Date().toISOString(),  // generat automàticament
    };

    this.resources.push(newResource);

    return newResource;
  }

  update(id: number, updateResourceDto: UpdateResourceDto): Resource {
    const resourceIndex = this.resources.findIndex((resource) => resource.id === id);

    if (resourceIndex === -1) {
      throw new NotFoundException(`Resource with id ${id} not found`);
    }

    const currentResource = this.resources[resourceIndex];
    const {
      name = currentResource.name,
      type = currentResource.type,
      status = currentResource.status,
      location = currentResource.location,
    } = updateResourceDto;

    this.resources[resourceIndex] = {
      ...currentResource,
      name,
      type,
      status,
      location,
    };

    return this.resources[resourceIndex];
  }


  remove(id: number): Resource {
    const resourceIndex = this.resources.findIndex((resource) => resource.id === id);

    if (resourceIndex === -1) {
      throw new NotFoundException(`404. Resource with id ${id} not found`);
    }

    const [deletedResource] = this.resources.splice(resourceIndex, 1);

    return deletedResource;
  } */
