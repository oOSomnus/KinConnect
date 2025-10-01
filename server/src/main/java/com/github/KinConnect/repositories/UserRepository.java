package com.github.KinConnect.repositories;

import com.github.KinConnect.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {
    User findByEmail(String email);

//    // 根据用户名查找
//    User findByName(String name);
//
//    // 多条件查询（AND）
//    User findByNameAndAge(String name, Integer age);
//
//    // 多条件查询（OR）
//    List<User> findByNameOrAge(String name, Integer age);
//
//    // 模糊匹配
//    List<User> findByNameContaining(String keyword);
//
//    // 大于、小于
//    List<User> findByAgeGreaterThan(int age);
}
