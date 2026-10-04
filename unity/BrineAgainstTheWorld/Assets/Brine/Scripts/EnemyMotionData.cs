using System;
namespace BrineGame {
 [Serializable] public class EnemyMotionProfile {public string action;public float lean,squash,lunge,hop,bob;}
 [Serializable] public class EnemyMotionData {public EnemyMotionProfile[] profiles;}
}
