class MySequelize {
    constructor(connect, tableName) {
        this.connection = connect;
        this.table = tableName;
    }

    async create(obj) {
        let sql = `INSERT INTO ${this.table} SET ?`;
        this.connection.query(sql, obj, (err, result) => {
            if (err) {
                throw error.message;
            }
            return result;
        });
    }

    async bulkCreate(arr) {
        for (const obj of arr) {
            let sql = `INSERT INTO ${this.table} SET ?`;
            this.connection.query(sql, obj, (err, result) => {
                if (err) {
                    throw error.message;
                }
                return result;
            });
        }
    }

    async findAll(options) {
        let sql = "";
        if (options) {
            sql += `SELECT`;
            if (options.attributes) {
                options.attributes.forEach((column) => {
                    if (Array.isArray(column)) {
                        sql += ` ${column[0]} AS ${column[1]},`;
                    } else {
                        sql += ` ${column} ,`;
                    }
                });
                sql = sql.slice(0, -1);
            } else {
                sql += ` *`;
            }
            sql += ` FROM ${this.table}`;

            // if (options.include) {
            //     sql += ` RIGHT JOIN ${options.include[0].table} ON ${this.table}.${options.include[0].sourceForeignKey} = ${options.include[0].table}.${options.include[0].tableForeignKey}`;
            // }
            if (options.where) {
                sql += ` WHERE`;
                for (const key in options.where) {
                    sql += ` ${key}='${options.where[key]}' AND`;
                }
                sql = sql.slice(0, -4);
            }
            if (options.order) {
                sql += ` ORDER BY ${options.order[0]} ${options.order[1]}`;
            }
            if (options.limit) {
                sql += ` LIMIT ${options.limit};`;
            }
        } else {
            sql = `SELECT * FROM ${this.table};`;
        }

        try {
            const result = await this.connection.query(sql);
            if (options) {
                if (options.include) {
                    let resultPlusINclude = await Promise.all(
                        result[0].map(async (obj) => {
                            const joiner = await this.connection.query(
                                `SELECT * FROM ${
                                    options.include[0].table
                                } WHERE ${options.include[0].tableForeignKey}=${
                                    obj[options.include[0].sourceForeignKey]
                                }`
                            );
                            obj[options.include[0].table] = joiner[0];
                            return obj;
                        })
                    );
                    return resultPlusINclude;
                }
            }
            return result[0];
        } catch (error) {
            throw error.message;
        }
    }
    /*
        Model.findAll({
            where: {
                is_admin: false
            },
            order: ['id', 'DESC'],
            limit 2
        })
        */
    /*
        Model.findAll({
            include:[
                {
                    table: playlists,             // table yo want to join
                    tableForeignKey: "creator",   // column reference in the table yo want to join
                    sourceForeignKey: "id",       // base table column reference
                }
            ] 
        })
        */
    /*
        Model.findAll({
            where: {
                [Op.gt]: {
                    id: 10
                },                // both [Op.gt] and [Op.lt] need to work so you can pass the tests
                [Op.lt]: {        
                    id: 20
                }
        })
        */

    async findByPk(id) {
        if (Number.isInteger(id)) {
            let sql = `SELECT * FROM ${this.table}
            WHERE id = ${id};`;
            try {
                const result = await this.connection.query(sql);
                return result[0];
            } catch (error) {
                throw error.message;
            }
        } else {
            throw { errno: 1064 };
        }
        /*
            Model.findByPk(id)
        */
    }

    async findOne(options) {
        const array = await this.findAll(options);
        return [array[0]];
        /*
            Model.findOne({
                where: {
                    is_admin: true
                }
            })
        */
    }

    //     if (options.where) {
    //         sql += ` WHERE`;
    //         for (const key in options.where) {
    //             sql += ` ${key}=${options.where[key]} AND`;
    //         }
    //     }
    //     sql = sql.slice(0, -3);
    // }
    async update(newDetsils, options) {
        console.log("options", options);
        let sql = `UPDATE ${this.table} SET ?`;
        if (options) {
            if (options.where) {
                let opUsed = Reflect.ownKeys(options.where); // All keys including symbols
                console.log(opUsed);
                let whereClause = " WHERE ";
                //Creating an array containing trios of [key,value,operator]
                let keyValuesOp = opUsed.map((op) =>
                    typeof op === "symbol"
                        ? [
                              Object.entries(options.where[op]),
                              Symbol.keyFor(op),
                          ].flat(2)
                        : [op, options.where[op], "="]
                );
                //Converting the array into sql clause: for[id,5,>]->id>5
                whereClause += keyValuesOp
                    .map(
                        (trio) =>
                            `${trio[0]}${trio[2]}${
                                isNaN(trio[1]) ? `'${trio[1]}'` : trio[1]
                            } AND`
                    )
                    .join(" ")
                    .slice(0, -3);

                sql += whereClause; //Appending the new where clause to the end of our sql statement
            }
        }
        console.log(sql);
        try {
            const result = await this.connection.query(sql, newDetsils);

            return result[0];
        } catch (error) {
            throw error.message;
        }
        /*
            Model.update( { name: 'test6', email: 'test6@gmail.com' } , {
                where: {                                                      // first object containing details to update
                    is_admin: true                                            // second object containing condotion for the query
                }
            })
        */
    }

    // async destroy({ force, ...options }) {
    async destroy(options) {
        let sql = "";
        if (options.force) {
            sql = `DELETE FROM ${this.table}`;
        } else {
            sql = `UPDATE ${this.table} SET deleted_at='2020-09-12 00:00:00'`;
        }
        sql += ` WHERE`;
        for (const key in options.where) {
            sql += ` ${key}=${options.where[key]} AND`;
        }
        sql = sql.slice(0, -3);
        try {
            const result = await this.connection.query(sql);
            return result[0];
        } catch (error) {
            throw error.message;
        }
        /*
            Model.destroy({
                where: {                                                      
                    is_admin: true                                            
                },
                force: true      // will cause hard delete
            })
        */
        /*
           Model.destroy({
               where: {                                                      
                   id: 10                                           
               },
               force: false      // will cause soft delete
           })
       */
        /*
           Model.destroy({
               where: {                                                      
                   id: 10                                           
               },  // will cause soft delete
           })
       */
    }

    async restore(options) {
        const obj = {
            deleted_at: null,
        };
        let sql = `UPDATE ${this.table} SET ?`;
        if (options) {
            if (options.where) {
                sql += ` WHERE`;
                for (const key in options.where) {
                    sql += ` ${key}=${options.where[key]} AND`;
                }
            }
            sql = sql.slice(0, -3);
        }
        try {
            const result = await this.connection.query(sql, obj);
            return result[0];
        } catch (error) {
            throw error.message;
        }
        /*
           Model.restore({
               where: {                                                      
                   id: 12                                          
               }
           })
       */
    }
}

module.exports = { MySequelize };
